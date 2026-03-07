import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  getMyWorkspace, subscribeProjects, subscribeTasks, subscribeMembers,
  createProject, updateProject, deleteProject, bulkCreateProjects,
  createTask, updateTask, deleteTask, bulkCreateTasks,
  getNotifSettings, saveNotifSettings,
  getNotifLogs, insertNotifLog,
  logGuestInvitation,
} from '../lib/db/index'
import { sendEmail, buildNotificationEmail, buildGuestInviteEmail, buildMeetingInviteEmail } from '../lib/gmail'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [workspace,    setWorkspace]    = useState(null)
  const [projects,     setProjects]     = useState([])
  const [tasks,        setTasks]        = useState([])
  const [members,      setMembers]      = useState([])
  const [notifSettings,setNotifSettings]= useState(null)
  const [notifLogs,    setNotifLogs]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [wsError,      setWsError]      = useState(null)

  useEffect(() => {
    if (!user) { setWorkspace(null); setProjects([]); setTasks([]); setLoading(false); return }
    setLoading(true)
    setWsError(null)
    const timeout = setTimeout(() => setLoading(false), 8000)

    getMyWorkspace(user.id).then(ws => {
      clearTimeout(timeout)
      if (!ws) { setWsError('no_workspace'); setLoading(false); return }
      setWorkspace(ws)
      const unsubProjects = subscribeProjects(ws.id, (data) => { setProjects(data); setLoading(false) })
      const unsubTasks    = subscribeTasks(ws.id, setTasks)
      getNotifSettings(ws.id).then(setNotifSettings).catch(() => {})
      getNotifLogs(ws.id).then(setNotifLogs).catch(() => {})
      const unsubMembers  = subscribeMembers(ws.id, setMembers)
      window.__pulseUnsub = () => { unsubProjects(); unsubTasks(); unsubMembers() }
    }).catch(err => {
      clearTimeout(timeout)
      setWsError(err.message)
      setLoading(false)
    })

    return () => { clearTimeout(timeout); window.__pulseUnsub?.() }
  }, [user?.id])

  // ─── Low-level email sender ───────────────────────────────────────────────
  // ─── Helper: build SendGrid config from notifSettings ────────────────────
  const emailConfig = useCallback(() => {
    const key = notifSettings?.sendgrid_api_key
    if (!key) throw new Error('SendGrid not configured — go to Settings → Notifications')
    return { apiKey: key, fromEmail: notifSettings.sendgrid_from_email || 'notifications@homzmart.com', fromName: 'Pulse' }
  }, [notifSettings])

  // ─── Low-level email sender ───────────────────────────────────────────────
  const sendRawEmail = useCallback(async ({ to, subject, html }) => {
    if (!notifSettings?.sendgrid_api_key) return false
    try {
      await sendEmail({ ...emailConfig(), to, subject, html })
      return true
    } catch(e) { console.warn('Email send failed:', e.message); return false }
  }, [notifSettings, emailConfig])

  // ─── Send meeting minutes to all attendee emails ──────────────────────────
  const sendMeetingInvites = useCallback(async ({ meeting, projectName, attendeeEmails, actionItems }) => {
    const cfg = emailConfig()
    if (!attendeeEmails?.length) return
    const appUrl = window.location.origin
    const actorName = user?.user_metadata?.full_name || user?.email || 'Someone'
    const meetingDate = meeting.meeting_date
      ? new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'TBD'
    const { subject, html } = buildMeetingInviteEmail({
      inviterName: actorName,
      meetingTitle: meeting.title,
      meetingDate,
      projectName,
      attendeeList: attendeeEmails.join(', '),
      summary: meeting.summary || '',
      actionItems: actionItems || [],
      appUrl,
    })
    const results = await Promise.allSettled(
      attendeeEmails.map(to => sendEmail({ ...cfg, to, subject, html }))
    )
    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length === results.length) throw new Error(failed[0].reason?.message || 'Failed to send emails')
    if (failed.length > 0) console.warn(`${failed.length}/${results.length} emails failed`)
  }, [notifSettings, user, emailConfig])

  // ─── Notifications ────────────────────────────────────────────────────────
  const sendNotification = useCallback(async ({ trigger, task, projectName, actorName, extraInfo }) => {
    if (!notifSettings?.sendgrid_api_key) return
    if (!notifSettings?.enabled_triggers?.[trigger]) return
    const recipients = new Set()
    if (notifSettings.notify_assignee && task.assignee_email) recipients.add(task.assignee_email)
    if (notifSettings.extra_emails) notifSettings.extra_emails.split(',').map(e => e.trim()).filter(Boolean).forEach(e => recipients.add(e))
    if (!recipients.size) return
    const cfg = emailConfig()
    const { subject, html } = buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo })
    let successes = 0, failures = 0
    await Promise.all([...recipients].map(async to => {
      let status = 'success'
      try { await sendEmail({ ...cfg, to, subject, html }); successes++ }
      catch (e) { console.warn('Email send failed:', e.message); failures++; status = 'failed' }
      insertNotifLog(workspace.id, { trigger_type: trigger, task_id: task.id, recipient: to, subject, status }).catch(() => {})
    }))
    setNotifLogs(prev => [{ trigger_type: trigger, task_id: task.id, recipient: [...recipients].join(', '), subject, status: failures ? 'partial' : 'success', id: Date.now(), created_at: new Date().toISOString() }, ...prev].slice(0, 50))
    return { successes, failures }
  }, [notifSettings, workspace, emailConfig])

  // ─── Projects ─────────────────────────────────────────────────────────────
  const addProject = useCallback(async (data) => {
    const proj = await createProject({ ...data, workspaceId: workspace.id, userId: user.id })
    // Optimistic: realtime will also update, but this is instant
    setProjects(prev => [...prev, proj])
    return proj
  }, [workspace, user])

  const editProject = useCallback(async (id, data) => {
    await updateProject(id, data)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }, [])

  const removeProject = useCallback(async (id) => {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    setTasks(prev => prev.filter(t => t.project_id !== id))
  }, [])

  const importProjects = useCallback(async (rows) => {
    const data = await bulkCreateProjects(rows, workspace.id, user.id)
    setProjects(prev => [...prev, ...data])
    return data
  }, [workspace, user])

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const addTask = useCallback(async (projectId, data) => {
    const task = await createTask({ projectId, workspaceId: workspace.id, userId: user.id, ...data, status: 'new' })
    setTasks(prev => [...prev, task])
    const project = projects.find(p => p.id === projectId)
    const actorName = user.user_metadata?.full_name || user.email || 'Someone'
    // Standard notification to workspace members
    sendNotification({ trigger: 'new_task', task, projectName: project?.name, actorName })
    if (data.assignee_email) {
      const isWorkspaceMember = members.some(m => m.email === data.assignee_email)
      if (isWorkspaceMember) {
        // Normal member — send standard task_assigned notification
        sendNotification({ trigger: 'task_assigned', task, projectName: project?.name, actorName })
      } else if (data.assignee_email.endsWith('@homzmart.com')) {
        // Guest — send guest invite email directly
        const appUrl = window.location.origin
        const { subject, html } = buildGuestInviteEmail({
          assigneeName: data.assignee_name || data.assignee_email,
          assignerName: actorName,
          taskTitle: task.title,
          projectName: project?.name || '',
          appUrl,
        })
        sendEmail({ ...emailConfig(), to: data.assignee_email, subject, html }).catch(() => {})
        logGuestInvitation(workspace.id, data.assignee_email, task.title, task.id).catch(() => {})
      }
    }
    return task
  }, [workspace, user, projects, members, notifSettings, sendNotification])

  const editTask = useCallback(async (id, data, oldTask) => {
    await updateTask(id, data)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const project = projects.find(p => p.id === oldTask?.project_id)
    const newTask = { ...oldTask, ...data }
    if (oldTask?.status !== data.status) {
      const trigger = data.status === 'done' ? 'task_completed' : 'status_changed'
      sendNotification({ trigger, task: newTask, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone', extraInfo: `Status changed to "${data.status}"` })
    }
    if (data.assignee_email && oldTask?.assignee_email !== data.assignee_email) {
      sendNotification({ trigger: 'task_assigned', task: newTask, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
    }
  }, [user, projects, sendNotification])

  const removeTask = useCallback(async (id) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const importTasks = useCallback(async (rows, projectMap) => {
    const data = await bulkCreateTasks(rows, workspace.id, user.id, projectMap)
    setTasks(prev => [...prev, ...data])
    return data
  }, [workspace, user])

  // ─── Notif settings ───────────────────────────────────────────────────────
  const updateNotifSettings = useCallback(async (settings) => {
    await saveNotifSettings(workspace.id, settings)
    setNotifSettings(prev => ({ ...prev, ...settings }))
  }, [workspace])

  // ─── Derived ──────────────────────────────────────────────────────────────
  const getProjectTasks = useCallback((projectId) => tasks.filter(t => t.project_id === projectId), [tasks])
  const myTasks = tasks.filter(t => t.status !== 'done' && t.assignee_email === user?.email).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))

  return (
    <DataContext.Provider value={{
      workspace, projects, tasks, members, notifSettings, notifLogs, loading, wsError,
      setWorkspace,
      addProject, editProject, removeProject, importProjects,
      addTask, editTask, removeTask, importTasks,
      updateNotifSettings, sendNotification, sendMeetingInvites, sendRawEmail,
      getProjectTasks, myTasks,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() { return useContext(DataContext) }
