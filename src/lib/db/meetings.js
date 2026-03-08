import { supabase } from '../supabase'

export async function getMeetings(projectId) {
  const { data, error } = await supabase
    .from('project_meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('meeting_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createMeeting({ projectId, workspaceId, userId, title, meeting_date, attendees, summary, action_items }) {
  const { data, error } = await supabase
    .from('project_meetings')
    .insert({ project_id: projectId, workspace_id: workspaceId, created_by: userId, title, meeting_date, attendees, summary, action_items })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeeting(id, updates) {
  const { error } = await supabase.from('project_meetings').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteMeeting(id) {
  const { error } = await supabase.from('project_meetings').delete().eq('id', id)
  if (error) throw error
}
