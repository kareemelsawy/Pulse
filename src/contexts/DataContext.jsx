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
  const [wsPending,    setWsPending]    = useState(null) // { workspaceName } if pending_approval
  const cleanupRef = useRef(null)

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      setWorkspace(null); setProjects([]); setTasks([])
      setLoading(false); setWsError(null); setWsPending(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setWsError(null)
    setWsPending(null)

    getMyWorkspace(user.id).then(ws => {
      if (cancelled) return
      if (!ws) {
        import('../lib/supabase').then(({ supabase }) => {
          supabase
            .from('workspace_members')
            .select('workspace_id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .then(async ({ count, error }) => {
              if (cancelled) return
              if (!error && count === 0) {
                // Check if user has a pending_approval request
                try {
                  const { data: pendingInvite } = await supabase
                    .from('workspace_invites')
                    .select('workspace_id, status')
                    .eq('email', user.email)
                    .eq('status', 'pending_approval')
                    .maybeSingle()
                  if (pendingInvite?.workspace_id) {
                    const { data: wsData } = await supabase
                      .from('workspaces')
                      .select('name')
                      .eq('id', pendingInvite.workspace_id)
                      .maybeSingle()

                    // Send confirmation email once — check sent_signup_email flag
                    if (!pendingInvite.sent_signup_email) {
                      try {
                        const { data: ns } = await supabase
                          .from('notif_settings')
                          .select('resend_api_key, sendgrid_api_key, from_email, from_name, function_secret')
                          .eq('workspace_id', pendingInvite.workspace_id)
                          .maybeSingle()
                        const apiKey = ns?.resend_api_key || ns?.sendgrid_api_key
                        if (apiKey && ns?.from_email) {
                          const workspaceName = wsData?.name || 'Pulse'
                          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#0D0F14;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td style="background:linear-gradient(135deg,#6B8EF7,#C084FC);border-radius:14px 14px 0 0;padding:18px 24px;">
    <span style="font-size:19px;font-weight:900;color:#fff;letter-spacing:-0.5px;">✦ Pulse</span>
  </td></tr>
  <tr><td style="background:#111420;border:1px solid rgba(255,255,255,0.09);border-top:none;border-radius:0 0 14px 14px;padding:28px 24px;">
    <h2 style="color:#F0F4FF;font-size:20px;font-weight:800;margin:0 0 12px;">Signup received ✓</h2>
    <p style="color:rgba(200,210,240,0.75);font-size:14px;line-height:1.7;margin:0 0 18px;">
      Hi <strong style="color:#F0F4FF;">${user.email}</strong>,<br><br>
      Your signup for <strong style="color:#F0F4FF;">${workspaceName}</strong> was successful. Your account is currently being reviewed by the workspace admin.<br><br>
      You'll receive access once they approve your request — no further action needed from your end.
    </p>
    <div style="background:#0E1019;border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
      <div style="color:rgba(200,210,240,0.40);font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Status</div>
      <div style="color:#FBBF24;font-size:13px;font-weight:700;">⏳ Pending admin approval</div>
    </div>
    <p style="color:rgba(200,210,240,0.40);font-size:11px;margin:0;">Sent by Pulse · ${workspaceName}</p>
  </td></tr>
</table></td></tr></table></body></html>`
                          const { sendEmail: _sendEmail } = await import('../lib/gmail')
                          await _sendEmail({ apiKey, fromEmail: ns.from_email, fromName: ns.from_name || 'Pulse', functionSecret: ns.function_secret, to: user.email, subject: `Your ${workspaceName} signup is being reviewed`, html })
                          // Mark email as sent
                          await supabase.from('workspace_invites').update({ sent_signup_email: true }).eq('workspace_id', pendingInvite.workspace_id).eq('email', user.email).eq('status', 'pending_approval')
                        }
                      } catch(emailErr) { console.warn('Signup confirmation email failed:', emailErr.message) }
                    }

                    if (!cancelled) {
                      setWsPending({ workspaceName: wsData?.name || 'Pulse' })
                      setLoading(false)
                      return
                    }
                  }
                } catch(_) {}
                setWsError('no_workspace')
              } else if (error) {
                setWsError('fetch_error')
              } else {
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
  const emailQueue = useRef([])
  const emailQueueRunning = useRef(false)

  const enqueueEmail = useCallback((emailArgs) => {
    emailQueue.current.push(emailArgs)
    if (emailQueueRunning.current) return
    emailQueueRunning.current = true
    const drain = async () => {
      while (emailQueue.current.length > 0) {
        const args = emailQueue.current.shift()
        try { await sendEmail(args) } catch(e) { console.warn('Email send failed:', e.message) }
        if (emailQueue.current.length > 0) await new Promise(r => setTimeout(r, 1100))
      }
      emailQueueRunning.current = false
    }
    drain()
  }, [])

  const emailConfig = useCallback(() => {
    const key = notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key
    if (!key) throw new Error('Resend not configured — go to Settings → Notifications')
    const fromEmail = notifSettings?.from_email || notifSettings?.sendgrid_from_email || ''
    const fromName  = notifSettings?.from_name  || notifSettings?.sendgrid_from_name  || 'Pulse'
    const functionSecret = notifSettings?.function_secret
    return { apiKey: key, fromEmail, fromName, functionSecret }
  }, [notifSettings])

  // ─── Low-level email sender (queued) ─────────────────────────────────────
  const sendRawEmail = useCallback(async ({ to, subject, html }) => {
    if (!notifSettings?.resend_api_key && !notifSettings?.sendgrid_api_key) return false
    try {
      const cfg = emailConfig()
      enqueueEmail({ ...cfg, to, subject, html })
      return true
    } catch(e) { console.warn('Email send failed:', e.message); return false }
  }, [notifSettings, emailConfig, enqueueEmail])

  // ─── Send meeting minutes to all attendee emails (queued) ─────────────────
  const sendMeetingInvites = useCallback(async ({ meeting, projectName, attendeeEmails, actionItems }) => {
    if (!attendeeEmails?.length) return
    let cfg
    try { cfg = emailConfig() } catch(e) { return }
    const appUrl = window.location.origin
    const actorName = user?.user_metadata?.full_name || user?.email || 'Someone'
    const meetingDate = meeting.meeting_date
      ? new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'TBD'
    const { subject, html } = buildMeetingInviteEmail({
      inviterName: actorName, meetingTitle: meeting.title, meetingDate,
      projectName, attendeeList: attendeeEmails.join(', '),
      summary: meeting.summary || '', actionItems: actionItems || [], appUrl,
    })
    for (const to of attendeeEmails) {
      enqueueEmail({ ...cfg, to, subject, html })
    }
  }, [notifSettings, user, emailConfig, enqueueEmail])

  // ─── Notifications (queued) ───────────────────────────────────────────────
  const sendNotification = useCallback(async ({ trigger, task, projectName, actorName, extraInfo }) => {
    if (!notifSettings?.resend_api_key && !notifSettings?.sendgrid_api_key) return
    if (!notifSettings?.enabled_triggers?.[trigger]) return
    const recipients = new Set()
    if (notifSettings.notify_assignee && task.assignee_email) recipients.add(task.assignee_email)
    if (notifSettings.extra_emails) notifSettings.extra_emails.split(',').map(e => e.trim()).filter(Boolean).forEach(e => recipients.add(e))
    if (!recipients.size) return
    let cfg
    try { cfg = emailConfig() } catch(e) { return }
    const appUrl = window.location.origin
    const { subject, html } = buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo, appUrl })
    for (const to of [...recipients]) {
      enqueueEmail({ ...cfg, to, subject, html })
      insertNotifLog(workspace.id, { trigger_type: trigger, task_id: task.id, recipient: to, subject, status: 'queued' }).catch(() => {})
    }
    setNotifLogs(prev => [{ trigger_type: trigger, task_id: task.id, recipient: [...recipients].join(', '), subject, status: 'queued', id: Date.now(), created_at: new Date().toISOString() }, ...prev].slice(0, 50))
  }, [notifSettings, workspace, emailConfig, enqueueEmail])

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
  // ─── Tasks ────────────────────────────────────────────────────────────────
  const addTask = useCallback(async (projectId, data) => {
    const task = await createTask({ projectId, workspaceId: workspace.id, userId: user.id, ...data, status: 'new' })
    setTasks(prev => [...prev, task])
    const project = projects.find(p => p.id === projectId)
    const actorName = user.user_metadata?.full_name || user.email || 'Someone'
    // Queue notifications — never await, never block the caller
    sendNotification({ trigger: 'new_task', task, projectName: project?.name, actorName })
    if (data.assignee_email) {
      const isWorkspaceMember = members.some(m => m.email?.toLowerCase() === data.assignee_email?.toLowerCase())
      if (isWorkspaceMember) {
        sendNotification({ trigger: 'task_assigned', task, projectName: project?.name, actorName })
      } else {
        try {
          const appUrl = window.location.origin
          const { subject, html } = buildGuestInviteEmail({
            assigneeName: data.assignee_name || data.assignee_email,
            assignerName: actorName,
            taskTitle: task.title,
            projectName: project?.name || '',
            appUrl,
          })
          enqueueEmail({ ...emailConfig(), to: data.assignee_email, subject, html })
          logGuestInvitation(workspace.id, data.assignee_email, task.title, task.id).catch(() => {})
        } catch(_) {}
      }
    }
    return task
  }, [workspace, user, projects, members, notifSettings, sendNotification, enqueueEmail, emailConfig])

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
      workspace, projects, tasks, members, notifSettings, notifLogs, loading, wsError, wsPending,
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
