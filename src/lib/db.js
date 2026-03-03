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
  // Step 1: get member list
  const { data: memberRows, error } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspaceId)

  if (error || !memberRows) return []

  // Step 2: try profiles join for names
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', memberRows.map(m => m.user_id))

  // Step 3: get current user from auth session as a guaranteed fallback
  const { data: { user: currentUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  return memberRows.map(m => {
    const profile = profileRows?.find(p => p.id === m.user_id)
    // Prefer profile data, fall back to current user's auth data, then short UUID
    const isCurrentUser = currentUser?.id === m.user_id
    const full_name = profile?.full_name
      || (isCurrentUser ? currentUser?.user_metadata?.full_name : null)
      || null
    const email = profile?.email
      || (isCurrentUser ? currentUser?.email : null)
      || null
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

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(workspaceId) {
  const { data, error } = await supabase
    .from('projects').select('*').eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createProject({ name, description, color, workspaceId, userId, is_pipeline }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, color, workspace_id: workspaceId, created_by: userId, is_pipeline: is_pipeline || false })
    .select().single()
  if (error) throw error
  return data
}

export async function updateProject(id, fields) {
  const { error } = await supabase
    .from('projects').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export function subscribeProjects(workspaceId, callback) {
  getProjects(workspaceId).then(callback).catch(() => callback([]))
  const channel = supabase.channel(`projects:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
      () => getProjects(workspaceId).then(callback).catch(() => {}))
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR') getProjects(workspaceId).then(callback).catch(() => {})
    })
  return () => supabase.removeChannel(channel)
}

// Bulk import projects from CSV
export async function bulkCreateProjects(projects, workspaceId, userId) {
  const rows = projects.map(p => ({
    name: p.name,
    description: p.description || '',
    color: p.color || '#4F8EF7',
    workspace_id: workspaceId,
    created_by: userId,
  }))
  const { data, error } = await supabase.from('projects').insert(rows).select()
  if (error) throw error
  return data
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(workspaceId) {
  const { data, error } = await supabase
    .from('tasks').select('*').eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createTask({ projectId, workspaceId, userId, title, status, priority, assignee_name, assignee_email, due_date }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ project_id: projectId, workspace_id: workspaceId, created_by: userId, title, status: status || 'new', priority, assignee_name, assignee_email, due_date })
    .select().single()
  if (error) throw error
  return data
}

export async function updateTask(id, fields) {
  const { error } = await supabase
    .from('tasks').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export function subscribeTasks(workspaceId, callback) {
  getTasks(workspaceId).then(callback).catch(() => callback([]))
  const channel = supabase.channel(`tasks:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` },
      () => getTasks(workspaceId).then(callback).catch(() => {}))
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR') getTasks(workspaceId).then(callback).catch(() => {})
    })
  return () => supabase.removeChannel(channel)
}

// Bulk import tasks from CSV
export async function bulkCreateTasks(tasks, workspaceId, userId, projectMap) {
  const rows = tasks.map(t => ({
    title: t.title,
    status: ['new','inprogress','review','done'].includes(t.status) ? t.status : 'new',
    priority: t.priority || 'medium',
    assignee_name: t.assignee_name || '',
    assignee_email: t.assignee_email || '',
    due_date: t.due_date || null,
    workspace_id: workspaceId,
    created_by: userId,
    project_id: projectMap[t.project_name] || projectMap[Object.keys(projectMap)[0]],
  })).filter(t => t.project_id)
  const { data, error } = await supabase.from('tasks').insert(rows).select()
  if (error) throw error
  return data
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, profiles(full_name, email)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) {
    // table may not exist yet
    return []
  }
  return (data || []).map(c => ({
    ...c,
    author_name: c.profiles?.full_name || c.profiles?.email || 'Unknown',
  }))
}

export async function addComment(taskId, userId, body) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: userId, body })
    .select().single()
  if (error) throw error
  return data
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId)
  if (error) throw error
}

// ─── Notification settings ────────────────────────────────────────────────────

export async function getNotifSettings(workspaceId) {
  const { data } = await supabase.from('notif_settings').select('*').eq('workspace_id', workspaceId).single()
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
  const { data } = await supabase.from('notif_logs').select('*')
    .eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50)
  return data || []
}

export async function insertNotifLog(workspaceId, log) {
  await supabase.from('notif_logs').insert({ ...log, workspace_id: workspaceId })
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

// ── Attachments ───────────────────────────────────────────────────────────────
export async function uploadAttachment(taskId, file) {
  const path = `${taskId}/${Date.now()}_${file.name.replace(/[^a-z0-9._-]/gi, '_')}`
  const { data, error } = await supabase.storage.from('task-attachments').upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(path)
  // Store record in DB
  const { data: rec, error: recErr } = await supabase.from('task_attachments').insert({
    task_id: taskId, file_name: file.name, file_path: path, file_url: publicUrl, file_size: file.size
  }).select().single()
  if (recErr) throw recErr
  return rec
}

export async function getAttachments(taskId) {
  const { data, error } = await supabase.from('task_attachments').select('*').eq('task_id', taskId).order('created_at')
  if (error) {
    // Table might not exist yet — return empty gracefully
    if (error.code === '42P01') return []
    throw error
  }
  return data || []
}

export async function deleteAttachment(id, filePath) {
  await supabase.storage.from('task-attachments').remove([filePath])
  const { error } = await supabase.from('task_attachments').delete().eq('id', id)
  if (error) throw error
}

// ── CSV Export ────────────────────────────────────────────────────────────────
export function exportTasksCsv(tasks, projectName) {
  const headers = ['title', 'status', 'priority', 'assignee_name', 'assignee_email', 'due_date']
  const rows = tasks.map(t => [
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.status || 'new',
    t.priority || 'medium',
    `"${(t.assignee_name || '').replace(/"/g, '""')}"`,
    t.assignee_email || '',
    t.due_date || '',
  ].join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(projectName || 'tasks').replace(/\s+/g, '-').toLowerCase()}-tasks.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Meetings ──────────────────────────────────────────────────────────────────
export async function getMeetings(projectId) {
  const { data, error } = await supabase
    .from('project_meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('meeting_date', { ascending: false })
  if (error) {
    if (error.code === '42P01') return []
    throw error
  }
  return data || []
}

export async function createMeeting(projectId, workspaceId, userId, fields) {
  const { data, error } = await supabase
    .from('project_meetings')
    .insert({ project_id: projectId, workspace_id: workspaceId, created_by: userId, ...fields })
    .select().single()
  if (error) throw error
  return data
}

export async function updateMeeting(id, fields) {
  const { error } = await supabase
    .from('project_meetings').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteMeeting(id) {
  const { error } = await supabase.from('project_meetings').delete().eq('id', id)
  if (error) throw error
}

export async function getMeetingActions(meetingId) {
  const { data, error } = await supabase
    .from('meeting_actions')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true })
  if (error) {
    if (error.code === '42P01') return []
    throw error
  }
  return data || []
}

export async function upsertMeetingActions(meetingId, actions) {
  // Delete existing then insert fresh — simpler than diffing
  await supabase.from('meeting_actions').delete().eq('meeting_id', meetingId)
  if (!actions.length) return []
  const { data, error } = await supabase
    .from('meeting_actions')
    .insert(actions.map(a => ({ ...a, meeting_id: meetingId })))
    .select()
  if (error) throw error
  return data || []
}
