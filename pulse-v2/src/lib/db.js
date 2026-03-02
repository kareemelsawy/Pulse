import { supabase } from './supabase'

// ─── Workspace ────────────────────────────────────────────────────────────────

export async function getMyWorkspace(userId) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()
  if (error) return null
  return { ...data.workspaces, role: data.role }
}

export async function getWorkspaceMembers(workspaceId) {
  // Try with profiles join first
  const { data, error } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at, profiles(full_name, email)')
    .eq('workspace_id', workspaceId)

  if (!error && data) {
    return data.map(m => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      full_name: m.profiles?.full_name || null,
      email: m.profiles?.email || null,
    }))
  }

  // Fallback: no profiles table yet
  const { data: fallback } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspaceId)
  return (fallback || []).map(m => ({ ...m, full_name: null, email: null }))
}

export async function joinWorkspaceByCode(code, userId) {
  // Find workspace with this invite code
  const { data: ws, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('invite_code', code.toUpperCase().trim())
    .single()
  if (error || !ws) throw new Error('Invalid invite code. Please check and try again.')

  // Check already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', ws.id)
    .eq('user_id', userId)
    .single()
  if (existing) return ws // already a member, just return

  // Join
  const { error: joinErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: ws.id, user_id: userId, role: 'member' })
  if (joinErr) throw new Error(joinErr.message)
  return ws
}

export async function regenerateInviteCode(workspaceId) {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const { error } = await supabase
    .from('workspaces')
    .update({ invite_code: newCode })
    .eq('id', workspaceId)
  if (error) throw error
  return newCode
}

export async function updateWorkspaceName(workspaceId, name) {
  const { error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', workspaceId)
  if (error) throw error
}

export async function removeMember(workspaceId, userId) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
  if (error) throw error
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(workspaceId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createProject({ name, description, color, workspaceId, userId }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, color, workspace_id: workspaceId, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id, fields) {
  const { error } = await supabase
    .from('projects')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export function subscribeProjects(workspaceId, callback) {
  getProjects(workspaceId).then(callback).catch(() => callback([]))
  const channel = supabase
    .channel(`projects:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
      () => getProjects(workspaceId).then(callback).catch(() => {}))
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') getProjects(workspaceId).then(callback).catch(() => {})
    })
  return () => supabase.removeChannel(channel)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(workspaceId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createTask({ projectId, workspaceId, userId, title, status, priority, assignee_name, assignee_email, due_date, tags }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ project_id: projectId, workspace_id: workspaceId, created_by: userId, title, status, priority, assignee_name, assignee_email, due_date, tags: tags || [] })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id, fields) {
  const { error } = await supabase
    .from('tasks')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export function subscribeTasks(workspaceId, callback) {
  getTasks(workspaceId).then(callback).catch(() => callback([]))
  const channel = supabase
    .channel(`tasks:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` },
      () => getTasks(workspaceId).then(callback).catch(() => {}))
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') getTasks(workspaceId).then(callback).catch(() => {})
    })
  return () => supabase.removeChannel(channel)
}

// ─── Notification settings ────────────────────────────────────────────────────

export async function getNotifSettings(workspaceId) {
  const { data } = await supabase
    .from('notif_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()
  return data
}

export async function saveNotifSettings(workspaceId, settings) {
  const { error } = await supabase
    .from('notif_settings')
    .upsert({ ...settings, workspace_id: workspaceId, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Notification log ─────────────────────────────────────────────────────────

export async function getNotifLogs(workspaceId) {
  const { data } = await supabase
    .from('notif_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export async function insertNotifLog(workspaceId, log) {
  await supabase.from('notif_logs').insert({ ...log, workspace_id: workspaceId })
}
