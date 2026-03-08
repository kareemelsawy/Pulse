import { supabase } from '../supabase'

export async function logGuestInvitation(workspaceId, email, taskTitle, taskId) {
  const { error } = await supabase.from('guest_invitations').upsert({
    workspace_id: workspaceId, email, task_title: taskTitle, task_id: taskId,
    invited_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,email,task_id' })
  if (error) console.warn('guest invite log failed:', error.message)
}
