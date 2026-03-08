import { supabase } from '../supabase'

// Tracks @homzmart.com emails assigned to tasks but not yet workspace members
export async function logGuestInvitation(workspaceId, email, taskTitle, taskId) {
  if (!email.endsWith('@homzmart.com')) return
  const { error } = await supabase
    .from('guest_invitations')
    .upsert({
      workspace_id: workspaceId,
      email,
      task_id: taskId,
      task_title: taskTitle,
      invited_at: new Date().toISOString(),
      status: 'pending',
    }, { onConflict: 'workspace_id,email,task_id', ignoreDuplicates: true })
  if (error) console.warn('guest_invitations log failed (table may not exist):', error.message)
}

export async function checkIsMember(userId) {
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
  return !!(data && data.length > 0)
}
