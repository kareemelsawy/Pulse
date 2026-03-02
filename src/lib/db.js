import { supabase } from './supabase'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return data.subscription.unsubscribe
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createProject({ name, description, color, userId }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, color, user_id: userId })
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
  // Tasks are deleted automatically by Postgres CASCADE
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export function subscribeProjects(userId, callback) {
  // Initial load
  getProjects(userId).then(callback)

  // Real-time updates
  const channel = supabase
    .channel('projects')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `user_id=eq.${userId}`,
    }, () => getProjects(userId).then(callback))
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createTask({ projectId, userId, title, status, priority, assignee_name, assignee_email, due_date, tags }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      user_id: userId,
      title,
      status,
      priority,
      assignee_name,
      assignee_email,
      due_date,
      tags: tags || [],
    })
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

export function subscribeTasks(userId, callback) {
  getTasks(userId).then(callback)

  const channel = supabase
    .channel('tasks')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`,
    }, () => getTasks(userId).then(callback))
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─── Notification settings ────────────────────────────────────────────────────

export async function getNotifSettings(userId) {
  const { data } = await supabase
    .from('notif_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function saveNotifSettings(userId, settings) {
  const { error } = await supabase
    .from('notif_settings')
    .upsert({ ...settings, user_id: userId, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Notification log ─────────────────────────────────────────────────────────

export async function getNotifLogs(userId) {
  const { data } = await supabase
    .from('notif_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export async function insertNotifLog(userId, log) {
  await supabase.from('notif_logs').insert({ ...log, user_id: userId })
}
