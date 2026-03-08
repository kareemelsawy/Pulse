import { supabase } from '../supabase'

export async function getMyWorkspace(userId) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
  if (error || !data?.length) return null
  const row = data[0]
  if (!row.workspaces) return null
  return { ...row.workspaces, role: row.role }
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
  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('invite_code', code.toUpperCase().trim())
    .single()
  if (error || !ws) throw new Error('Invalid invite code. Please check and try again.')
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', ws.id)
    .eq('user_id', userId)
    .single()
  if (existing) return ws
  const { error: joinErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: ws.id, user_id: userId, role: 'member' })
  if (joinErr) throw new Error(joinErr.message)
  return ws
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
