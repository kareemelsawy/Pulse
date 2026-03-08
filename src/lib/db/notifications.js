import { supabase } from '../supabase'

export async function getNotifSettings(workspaceId) {
  const { data, error } = await supabase
    .from('notif_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveNotifSettings(workspaceId, settings) {
  const { error } = await supabase
    .from('notif_settings')
    .upsert({ workspace_id: workspaceId, ...settings }, { onConflict: 'workspace_id' })
  if (error) throw error
}

export async function getNotifLogs(workspaceId) {
  const { data, error } = await supabase
    .from('notif_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function insertNotifLog(workspaceId, { trigger_type, task_id, recipient, subject, status }) {
  const { error } = await supabase.from('notif_logs').insert({
    workspace_id: workspaceId, trigger_type, task_id, recipient, subject, status,
  })
  if (error) console.warn('notif log insert failed:', error.message)
}
