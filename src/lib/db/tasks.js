import { supabase } from '../supabase'

export function subscribeTasks(workspaceId, onChange) {
  supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at')
    .then(({ data }) => { if (data) onChange(data) })

  const channel = supabase
    .channel(`tasks:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` },
      () => {
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at')
          .then(({ data }) => { if (data) onChange(data) })
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function createTask({ projectId, workspaceId, userId, title, description, status, priority, assignee_email, assignee_name, due_date, start_date }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId, workspace_id: workspaceId, created_by: userId,
      title, description, status: status || 'new', priority, assignee_email,
      assignee_name, due_date, start_date,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id, updates) {
  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function bulkCreateTasks(rows, workspaceId, userId, projectMap) {
  const inserts = rows.map(r => ({
    workspace_id: workspaceId, created_by: userId,
    project_id: projectMap[r.project_name] || r.project_id,
    title: r.title, description: r.description || null,
    status: r.status || 'new', priority: r.priority || null,
    assignee_email: r.assignee_email || null,
    assignee_name: r.assignee_name || null,
    due_date: r.due_date || null,
    start_date: r.start_date || null,
  }))
  const { data, error } = await supabase.from('tasks').insert(inserts).select()
  if (error) throw error
  return data
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function getTaskComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function addTaskComment(taskId, userId, authorName, body) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: userId, author_name: authorName, body })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTaskComment(commentId) {
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId)
  if (error) throw error
}

// ─── Attachments ──────────────────────────────────────────────────────────────
export async function getTaskAttachments(taskId) {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function uploadAttachment(taskId, workspaceId, file) {
  const ext = file.name.split('.').pop()
  const path = `${workspaceId}/${taskId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({ task_id: taskId, file_name: file.name, file_url: publicUrl, file_size: file.size, file_type: file.type })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAttachment(attachmentId, filePath) {
  if (filePath) await supabase.storage.from('attachments').remove([filePath])
  const { error } = await supabase.from('task_attachments').delete().eq('id', attachmentId)
  if (error) throw error
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
export function exportTasksCsv(tasks, projects) {
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))
  const rows = [
    ['Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date', 'Start Date', 'Description'],
    ...tasks.map(t => [
      t.title, projectMap[t.project_id] || '', t.status, t.priority || '',
      t.assignee_name || t.assignee_email || '', t.due_date || '', t.start_date || '',
      (t.description || '').replace(/\n/g, ' '),
    ]),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'tasks.csv'; a.click()
  URL.revokeObjectURL(url)
}
