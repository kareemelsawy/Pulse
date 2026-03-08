import { supabase } from '../supabase'

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
