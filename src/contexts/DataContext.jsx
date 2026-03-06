import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  getMyWorkspace, subscribeProjects, subscribeTasks, subscribeMembers,
  createProject, updateProject, deleteProject, bulkCreateProjects,
  createTask, updateTask, deleteTask, bulkCreateTasks,
  getNotifSettings, saveNotifSettings,
  getNotifLogs, insertNotifLog,
} from '../lib/db'
import { sendGmail, buildNotificationEmail } from '../lib/gmail'

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

  // ─── Notifications ────────────────────────────────────────────────────────
  const inviteExternalAssignee = useCallback(async (email, task, projectName) => {
    if (!email) return
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.endsWith('@homzmart.com')) return
    if (!workspace?.invite_code || !workspace?.name) return
    if (!notifSettings?.gmail_access_token) return
    if (members?.some(m => m.email?.toLowerCase() === trimmed)) return
    const inviteUrl = `${window.location.origin}?invite=${workspace.invite_code}`
    const subject = `[Pulse] You’ve been assigned a task in ${workspace.name}`
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#0D0F14;border-radius:16px;overflow:hidden;border:1px solid #252A3A;">
    <div style="background:linear-gradient(135deg,#4F8EF7,#A78BFA);padding:22px 26px;display:flex;align-items:center;">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;flex:1;">◈ Pulse</span>
      <span style="background:rgba(255,255,255,0.2);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;">Task Invitation</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#94A3B8;font-size:13px;margin:0 0 10px;">
        You’ve been assigned a task in the <strong style="color:#E2E8F0;">${workspace.name}</strong> workspace${projectName ? ` (project <strong style="color:#E2E8F0;">${projectName}</strong>)` : ''}.
      </p>
      <h2 style="color:#E2E8F0;font-size:19px;margin:0 0 16px;font-weight:700;">${task.title}</h2>
      <p style="color:#CBD5F5;font-size:13px;margin:0 0 18px;">To view and update this task, you’ll need to sign in to Pulse with your <strong>@homzmart.com</strong> email and join the workspace.</p>
      <a href="${inviteUrl}" style="display:inline-block;background:#4F8EF7;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:14px;">Open Pulse &amp; Join Workspace</a>
      <p style="color:#64748B;font-size:11px;margin:0;">If the button doesn’t work, copy and paste this link into your browser:<br/><span style="color:#94A3B8;">${inviteUrl}</span></p>
      <p style="margin:20px 0 0;color:#475569;font-size:11px;text-align:center;">Sent by ◈ Pulse</p>
    </div>
  </div>
</body>
</html>`
    try {
      await sendGmail(notifSettings.gmail_access_token, { to: trimmed, subject, html })
    } catch (e) {
      console.warn('Invite email send failed:', e.message)
    }
  }, [workspace, notifSettings, members])

  const sendNotification = useCallback(async ({ trigger, task, projectName, actorName, extraInfo }) => {
    if (!notifSettings?.gmail_access_token) return
    if (!notifSettings?.enabled_triggers?.[trigger]) return
    const recipients = new Set()
    if (notifSettings.notify_assignee && task.assignee_email) recipients.add(task.assignee_email)
    if (notifSettings.extra_emails) notifSettings.extra_emails.split(',').map(e => e.trim()).filter(Boolean).forEach(e => recipients.add(e))
    if (!recipients.size) return
    const { subject, html } = buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo })
    let successes = 0, failures = 0
    await Promise.all([...recipients].map(async to => {
      try { await sendGmail(notifSettings.gmail_access_token, { to, subject, html }); successes++ }
      catch (e) { console.warn('Gmail send failed:', e.message); failures++ }
    }))
    const log = { trigger, task_title: task.title, project_name: projectName, recipients: [...recipients], successes, failures, created_at: new Date().toISOString() }
    await insertNotifLog(workspace.id, log).catch(() => {})
    setNotifLogs(prev => [{ ...log, id: Date.now() }, ...prev].slice(0, 50))
    return { successes, failures }
  }, [notifSettings, workspace])

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
    sendNotification({ trigger: 'new_task', task, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
    if (data.assignee_email) {
      sendNotification({ trigger: 'task_assigned', task, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
      inviteExternalAssignee(data.assignee_email, task, project?.name)
    }
    return task
  }, [workspace, user, projects, sendNotification, inviteExternalAssignee])

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
      inviteExternalAssignee(data.assignee_email, newTask, project?.name)
    }
  }, [user, projects, sendNotification, inviteExternalAssignee])

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
  const myTasks = tasks.filter(t => t.status !== 'done').sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))

  return (
    <DataContext.Provider value={{
      workspace, projects, tasks, members, notifSettings, notifLogs, loading, wsError,
      setWorkspace,
      addProject, editProject, removeProject, importProjects,
      addTask, editTask, removeTask, importTasks,
      updateNotifSettings, sendNotification,
      getProjectTasks, myTasks,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() { return useContext(DataContext) }
