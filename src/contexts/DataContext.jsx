import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  getMyWorkspace, subscribeProjects, subscribeTasks, subscribeMembers,
  createProject, updateProject, deleteProject, bulkCreateProjects,
  createTask, updateTask, deleteTask, bulkCreateTasks,
  getNotifSettings, saveNotifSettings,
  getNotifLogs, insertNotifLog,
  logGuestInvitation,
} from '../lib/db/index'
import { sendEmail, buildNotificationEmail, buildGuestInviteEmail, buildMeetingInviteEmail, buildDueSoonEmail } from '../lib/gmail'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user, authReady } = useAuth()
  const [workspace,    setWorkspace]    = useState(null)
  const [projects,     setProjects]     = useState([])
  const [tasks,        setTasks]        = useState([])
  const [members,      setMembers]      = useState([])
  const [notifSettings,setNotifSettings]= useState(null)
  const [notifLogs,    setNotifLogs]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [wsError,      setWsError]      = useState(null)
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      setWorkspace(null); setProjects([]); setTasks([])
      setLoading(false); setWsError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setWsError(null)

    getMyWorkspace(user.id).then(ws => {
      if (cancelled) return
      if (!ws) {
        // Only show workspace setup if we're confident the user has no workspace.
        // getMyWorkspace returns null both when there's truly no membership AND
        // when there's a transient DB/RLS error — so we do a second targeted
        // check to distinguish between "no membership" vs "fetch failed".
        import('../lib/supabase').then(({ supabase }) => {
          supabase
            .from('workspace_members')
            .select('workspace_id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .then(({ count, error }) => {
              if (cancelled) return
              if (!error && count === 0) {
                // Confirmed: user genuinely has no workspace membership
                setWsError('no_workspace')
              } else if (error) {
                // DB/RLS error — don't send to invite screen, show a retry state
                setWsError('fetch_error')
              } else {
                // count > 0 but getMyWorkspace failed (RLS/join issue) — retry
                setWsError('fetch_error')
              }
              setLoading(false)
            })
        }).catch(() => {
          if (!cancelled) { setWsError('no_workspace'); setLoading(false) }
        })
        return
      }
      setWorkspace(ws)
      const unsubProjects = subscribeProjects(ws.id, (data) => {
        if (!cancelled) { setProjects(data); setLoading(false) }
      })
      const unsubTasks   = subscribeTasks(ws.id, data => { if (!cancelled) setTasks(data) })
      const unsubMembers = subscribeMembers(ws.id, data => { if (!cancelled) setMembers(data) })
      getNotifSettings(ws.id).then(d => { if (!cancelled) setNotifSettings(d) }).catch(() => {})
      getNotifLogs(ws.id).then(d => { if (!cancelled) setNotifLogs(d) }).catch(() => {})
      cleanupRef.current = () => { unsubProjects(); unsubTasks(); unsubMembers() }
    }).catch(() => {
      if (!cancelled) { setWsError('fetch_error'); setLoading(false) }
    })

    return () => { cancelled = true; cleanupRef.current?.() }
  }, [user?.id, authReady])

  // ─── Low-level email sender ───────────────────────────────────────────────
  // ─── Helper: build SendGrid config from notifSettings ────────────────────
  const emailConfig = useCallback(() => {
    const key = notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key
    if (!key) throw new Error('Resend not configured — go to Settings → Notifications')
    const fromEmail = notifSettings?.from_email || notifSettings?.sendgrid_from_email || ''
    const fromName  = notifSettings?.from_name  || notifSettings?.sendgrid_from_name  || 'Pulse'
    const functionSecret = notifSettings?.function_secret
    return { apiKey: key, fromEmail, fromName, functionSecret }
  }, [notifSettings])

  // ─── Low-level email sender ───────────────────────────────────────────────
  const sendRawEmail = useCallback(async ({ to, subject, html }) => {
    if (!notifSettings?.resend_api_key && !notifSettings?.sendgrid_api_key) return false
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
    // Send sequentially with a 600ms gap to stay under Resend's 2/sec rate limit
    let failures = 0
    for (let i = 0; i < attendeeEmails.length; i++) {
      try {
        await sendEmail({ ...cfg, to: attendeeEmails[i], subject, html })
      } catch (e) {
        console.warn(`Email to ${attendeeEmails[i]} failed:`, e.message)
        failures++
      }
      // Wait between sends — skip delay after the last one
      if (i < attendeeEmails.length - 1) {
        await new Promise(res => setTimeout(res, 600))
      }
    }
    if (failures === attendeeEmails.length) throw new Error('All emails failed to send. Check your Resend configuration.')
    if (failures > 0) console.warn(`${failures}/${attendeeEmails.length} emails failed`)
  }, [notifSettings, user, emailConfig])

  // ─── Notifications ────────────────────────────────────────────────────────
  const sendNotification = useCallback(async ({ trigger, task, projectName, actorName, extraInfo }) => {
    if (!notifSettings?.resend_api_key && !notifSettings?.sendgrid_api_key) return
    if (!notifSettings?.enabled_triggers?.[trigger]) return
    const recipients = new Set()
    if (notifSettings.notify_assignee && task.assignee_email) recipients.add(task.assignee_email)
    if (notifSettings.extra_emails) notifSettings.extra_emails.split(',').map(e => e.trim()).filter(Boolean).forEach(e => recipients.add(e))
    if (!recipients.size) return
    const cfg = emailConfig()
    const appUrl = window.location.origin
    const { subject, html } = buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo, appUrl })
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
    // Notify extra_emails recipients about the new task
    sendNotification({ trigger: 'new_task', task, projectName: project?.name, actorName })
    if (data.assignee_email) {
      // Case-insensitive check for workspace membership
      const isWorkspaceMember = members.some(
        m => m.email?.toLowerCase() === data.assignee_email?.toLowerCase()
      )
      if (isWorkspaceMember) {
        // Workspace member — send task_assigned notification to their email
        sendNotification({ trigger: 'task_assigned', task, projectName: project?.name, actorName })
      } else {
        // Not a workspace member — treat as guest, send invite email
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

  // ─── Role helpers ─────────────────────────────────────────────────────────
  // Roles: 'owner'/'admin' → full access | 'pm' → program manager | 'member'/'user' → basic user
  const userRole    = workspace?.role || 'member'
  const isAdmin     = userRole === 'owner' || userRole === 'admin' || workspace?.owner_id === user?.id
  const isPM        = !isAdmin && (userRole === 'pm')
  const isBasicUser = !isAdmin && !isPM
  // Projects/tasks the user has access to based on role
  const myProjects  = isAdmin
    ? projects.filter(p => !p.is_pipeline)
    : isPM
      ? projects.filter(p => !p.is_pipeline && tasks.some(t => t.project_id === p.id && (t.assignee_email === user?.email || p.pm_email === user?.email)))
      : projects.filter(p => !p.is_pipeline && tasks.some(t => t.project_id === p.id && t.assignee_email === user?.email))

  // ─── Due-tomorrow reminder scheduler ─────────────────────────────────────
  // Runs on load and when tasks/notifSettings change.
  // Sends one reminder per task due tomorrow, deduped by day via localStorage.
  useEffect(() => {
    if (!notifSettings?.enabled_triggers?.due_soon) return
    if (!notifSettings?.resend_api_key && !notifSettings?.sendgrid_api_key) return
    if (!tasks.length || !workspace) return

    const todayStr    = new Date().toISOString().slice(0, 10)
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const sentKey     = `pulse_due_soon_sent_${workspace.id}_${todayStr}`
    const alreadySent = new Set(JSON.parse(localStorage.getItem(sentKey) || '[]'))

    const dueTomorrow = tasks.filter(t =>
      t.status !== 'done' &&
      t.due_date === tomorrowStr &&
      t.assignee_email &&
      !alreadySent.has(t.id)
    )
    if (!dueTomorrow.length) return

    const key = notifSettings.resend_api_key || notifSettings.sendgrid_api_key
    if (!key) return
    const cfg = {
      apiKey:         key,
      fromEmail:      notifSettings.from_email || notifSettings.sendgrid_from_email || '',
      fromName:       notifSettings.from_name  || notifSettings.sendgrid_from_name  || 'Pulse',
      functionSecret: notifSettings.function_secret,
    }
    const appUrl = window.location.origin

    dueTomorrow.forEach(task => {
      const project = projects.find(p => p.id === task.project_id)
      const { subject, html } = buildDueSoonEmail({ task, projectName: project?.name || '', appUrl })
      sendEmail({ ...cfg, to: task.assignee_email, subject, html })
        .then(() => {
          alreadySent.add(task.id)
          localStorage.setItem(sentKey, JSON.stringify([...alreadySent]))
          insertNotifLog(workspace.id, { trigger_type: 'due_soon', task_id: task.id, recipient: task.assignee_email, subject, status: 'success' }).catch(() => {})
        })
        .catch(err => {
          console.warn('Due-soon email failed:', err.message)
          insertNotifLog(workspace.id, { trigger_type: 'due_soon', task_id: task.id, recipient: task.assignee_email, subject, status: 'failed' }).catch(() => {})
        })
    })
  }, [tasks, notifSettings, workspace, projects])

  return (
    <DataContext.Provider value={{
      workspace, projects, tasks, members, notifSettings, notifLogs, loading, wsError,
      setWorkspace,
      addProject, editProject, removeProject, importProjects,
      addTask, editTask, removeTask, importTasks,
      updateNotifSettings, sendNotification, sendMeetingInvites, sendRawEmail, fireNotification: sendNotification,
      getProjectTasks, myTasks, userRole, isAdmin, isPM, isBasicUser, myProjects,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() { return useContext(DataContext) }
