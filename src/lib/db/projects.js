import { supabase } from '../supabase'

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
