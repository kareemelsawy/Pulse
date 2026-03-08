import { supabase } from '../supabase'

export async function getMyWorkspace(userId) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return { ...data.workspaces, memberRole: data.role }
}

export async function createWorkspace(name, userId) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { data: ws, error } = await supabase
    .from('workspaces')
    .insert({ name, invite_code: code, owner_id: userId })
    .select()
    .single()
  if (error) throw error

  await supabase.from('workspace_members').insert({
    workspace_id: ws.id, user_id: userId, role: 'admin',
    email: (await supabase.auth.getUser()).data.user?.email,
  })

  return ws
}

export async function joinWorkspace(code, userId) {
  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle()
  if (error) throw error
  if (!ws) throw new Error('Invalid invite code')

  const user = (await supabase.auth.getUser()).data.user
  const { error: memberError } = await supabase
    .from('workspace_members')
    .upsert({ workspace_id: ws.id, user_id: userId, role: 'member', email: user?.email }, { onConflict: 'workspace_id,user_id' })
  if (memberError) throw memberError

  return ws
}

export function subscribeMembers(workspaceId, onChange) {
  // Initial load
  supabase
    .from('workspace_members')
    .select('id, user_id, email, role, full_name, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at')
    .then(({ data }) => { if (data) onChange(data) })

  const channel = supabase
    .channel(`members:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspaceId}` },
      () => {
        supabase
          .from('workspace_members')
          .select('id, user_id, email, role, full_name, created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at')
          .then(({ data }) => { if (data) onChange(data) })
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
