import { supabase } from '../supabase'

export async function getNotifSettings(workspaceId) {
  const { data } = await supabase.from('notif_settings').select('*').eq('workspace_id', workspaceId).single()
  return data
}

export async function saveNotifSettings(workspaceId, settings) {
  const { error } = await supabase
    .from('notif_settings')
    .upsert(
      { ...settings, workspace_id: workspaceId, updated_at: new Date().toISOString() },
      { onConflict: 'workspace_id' }
    )
  if (error) throw error
}

export async function getNotifLogs(workspaceId) {
  const { data } = await supabase.from('notif_logs').select('*')
    .eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50)
  return data || []
}

export async function insertNotifLog(workspaceId, log) {
  await supabase.from('notif_logs').insert({ ...log, workspace_id: workspaceId })
}
