import { supabase } from '../supabase'

export async function getMyWorkspace(userId) {
  // Step 1: get workspace_id and role for this user
  const { data: memberRows, error: memberErr } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)
    .limit(1)

  if (memberErr || !memberRows?.length) return null

  const { workspace_id, role } = memberRows[0]

  // Step 2: fetch workspace directly (avoids nested-join RLS issues)
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspace_id)
    .single()

  if (wsErr || !ws) return null
  return { ...ws, role }
}

export async function getWorkspaceMembers(workspaceId) {
  const { data: memberRows, error } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspaceId)
  if (error || !memberRows) return []

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', memberRows.map(m => m.user_id))

  const { data: { user: currentUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  return memberRows.map(m => {
    const profile = profileRows?.find(p => p.id === m.user_id)
    const isCurrentUser = currentUser?.id === m.user_id
    const full_name = profile?.full_name || (isCurrentUser ? currentUser?.user_metadata?.full_name : null) || null
    const email = profile?.email || (isCurrentUser ? currentUser?.email : null) || null
    return { user_id: m.user_id, role: m.role, joined_at: m.joined_at, full_name, email }
  })
}

export async function joinWorkspaceByCode(code, userId) {
  const trimmedCode = code.toUpperCase().trim()

  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('invite_code', trimmedCode)
    .single()
  if (error || !ws) throw new Error('Invalid invite code. Please check and try again.')

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', ws.id)
    .eq('user_id', userId)
    .single()
  if (existing) return { ...ws, role: existing.role }

  // Look up pending invite to get assigned role
  const { data: invite } = await supabase
    .from('workspace_invites')
    .select('role, project_ids')
    .eq('workspace_id', ws.id)
    .eq('invite_code', trimmedCode)
    .is('accepted_at', null)
    .limit(1)
    .maybeSingle()
    .catch(() => ({ data: null }))

  const assignedRole    = invite?.role || 'member'
  const assignedProjects = invite?.project_ids || null

  // Insert member with role from invite (or default 'member')
  const { error: joinErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: ws.id,
      user_id:      userId,
      role:         assignedRole,
      project_ids:  assignedProjects,
    })
  if (joinErr) throw new Error(joinErr.message)

  // Mark invite as accepted
  if (invite) {
    await supabase
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('workspace_id', ws.id)
      .eq('invite_code', trimmedCode)
      .catch(() => {})
  }

  return { ...ws, role: assignedRole }
}

export async function createWorkspace(userId, name) {
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  // Create workspace
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name: name.trim(), owner_id: userId, invite_code: inviteCode })
    .select()
    .single()
  if (wsErr) throw new Error(wsErr.message)
  // Add creator as owner member
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: ws.id, user_id: userId, role: 'owner' })
  if (memErr) throw new Error(memErr.message)
  return { ...ws, role: 'owner' }
}

export async function regenerateInviteCode(workspaceId) {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const { error } = await supabase.from('workspaces').update({ invite_code: newCode }).eq('id', workspaceId)
  if (error) throw error
  return newCode
}

export async function updateWorkspaceName(workspaceId, name) {
  const { error } = await supabase.from('workspaces').update({ name }).eq('id', workspaceId)
  if (error) throw error
}

export async function removeMember(workspaceId, userId) {
  const { error } = await supabase.from('workspace_members').delete()
    .eq('workspace_id', workspaceId).eq('user_id', userId)
  if (error) throw error
}

export function subscribeMembers(workspaceId, callback) {
  getWorkspaceMembers(workspaceId).then(callback).catch(() => callback([]))
  const channel = supabase
    .channel(`members:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspaceId}` },
      () => getWorkspaceMembers(workspaceId).then(callback).catch(() => {}))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
