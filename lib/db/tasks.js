import { supabase } from '../supabase'

export async function getTasks(workspaceId) {
  const { data, error } = await supabase
    .from('tasks').select('*').eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createTask({ projectId, workspaceId, userId, title, status, priority, assignee_name, assignee_email, due_date, meeting_id }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ project_id: projectId, workspace_id: workspaceId, created_by: userId, title, status: status || 'new', priority, assignee_name, assignee_email, due_date, meeting_id })
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

export async function getTasksByMeeting(meetingId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true })
  if (error) {
    if (error.code === '42703') return []
    throw error
  }
  return data || []
}

export async function getComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, profiles(full_name, email)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) return []
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

export async function uploadAttachment(taskId, file) {
  const path = `${taskId}/${Date.now()}_${file.name.replace(/[^a-z0-9._-]/gi, '_')}`
  const { data, error } = await supabase.storage.from('task-attachments').upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(path)
  const { data: rec, error: recErr } = await supabase.from('task_attachments').insert({
    task_id: taskId, file_name: file.name, file_path: path, file_url: publicUrl, file_size: file.size
  }).select().single()
  if (recErr) throw recErr
  return rec
}

export async function getAttachments(taskId) {
  const { data, error } = await supabase.from('task_attachments').select('*').eq('task_id', taskId).order('created_at')
  if (error) {
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
