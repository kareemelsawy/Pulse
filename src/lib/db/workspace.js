import { supabase } from '../supabase'

export async function getMyWorkspace(userId) {
  // Single query: get workspace_id + role together
  const { data: memberRow, error: memberErr } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (memberErr || !memberRow) return null

  const { workspace_id, role: rawRole } = memberRow

  // Fetch workspace details
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspace_id)
    .single()

  if (wsErr || !ws) return null

  // Determine final role — owner always gets full access
  const role = ws.owner_id === userId ? 'owner' : (rawRole || 'member')

  return { ...ws, role }
}

export async function getWorkspaceMembers(workspaceId) {
  // Try with role column first; fall back to without if column missing
  let memberRows = null
  const { data: withRole, error: err1 } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspaceId)
  if (!err1) {
    memberRows = withRole
  } else {
    // role column doesn't exist yet — fetch without it
    const { data: noRole, error: err2 } = await supabase
      .from('workspace_members')
      .select('user_id, joined_at')
      .eq('workspace_id', workspaceId)
    if (err2 || !noRole) return []
    memberRows = noRole.map(m => ({ ...m, role: 'member' }))
  }
  if (!memberRows) return []

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

  // Look up pending invite — first try email match, then fall back to code-only
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const userEmail = authUser?.email

  let invite = null
  if (userEmail) {
    const { data: emailInvite } = await supabase
      .from('workspace_invites')
      .select('role, project_ids, id')
      .eq('workspace_id', ws.id)
      .eq('email', userEmail)
      .is('accepted_at', null)
      .maybeSingle()
    if (emailInvite) invite = emailInvite
  }

  if (!invite) {
    const { data: codeInvite } = await supabase
      .from('workspace_invites')
      .select('role, project_ids, id, status')
      .eq('workspace_id', ws.id)
      .eq('invite_code', trimmedCode)
      .is('accepted_at', null)
      .limit(1)
      .maybeSingle()
    if (codeInvite) invite = codeInvite
  }

  // No pre-approved invite for this email — put in pending_approval queue
  if (!invite) {
    const { data: alreadyPending } = await supabase
      .from('workspace_invites')
      .select('id')
      .eq('workspace_id', ws.id)
      .eq('email', userEmail)
      .eq('status', 'pending_approval')
      .maybeSingle()
    if (!alreadyPending) {
      await supabase.from('workspace_invites').insert({
        workspace_id: ws.id,
        email:        userEmail,
        role:         'user',
        invite_code:  trimmedCode,
        status:       'pending_approval',
        created_at:   new Date().toISOString(),
      })
    }
    // Return special flag — UI will show awaiting approval screen
    return { ...ws, role: null, pending_approval: true }
  }

  const assignedRole     = invite?.role || 'member'
  const assignedProjects = invite?.project_ids || null

  const { error: joinErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: ws.id,
      user_id:      userId,
      role:         assignedRole,
      project_ids:  assignedProjects,
    })
  if (joinErr) throw new Error(joinErr.message)

  if (invite?.id) {
    await supabase
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString(), status: 'accepted' })
      .eq('id', invite.id)
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
