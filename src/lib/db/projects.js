import { supabase } from '../supabase'

export function subscribeProjects(workspaceId, onChange) {
  supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at')
    .then(({ data }) => { if (data) onChange(data) })

  const channel = supabase
    .channel(`projects:${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
      () => {
        supabase.from('projects').select('*').eq('workspace_id', workspaceId).order('created_at')
          .then(({ data }) => { if (data) onChange(data) })
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function createProject({ workspaceId, userId, name, description, color, start_date, end_date, status }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ workspace_id: workspaceId, created_by: userId, name, description, color, start_date, end_date, status: status || 'active' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id, updates) {
  const { error } = await supabase.from('projects').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function bulkCreateProjects(rows, workspaceId, userId) {
  const inserts = rows.map(r => ({
    workspace_id: workspaceId, created_by: userId,
    name: r.name, description: r.description || null,
    color: r.color || null, status: r.status || 'active',
    start_date: r.start_date || null, end_date: r.end_date || null,
  }))
  const { data, error } = await supabase.from('projects').insert(inserts).select()
  if (error) throw error
  return data
}
