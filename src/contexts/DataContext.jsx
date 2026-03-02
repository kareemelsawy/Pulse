import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  getMyWorkspace, subscribeProjects, subscribeTasks,
  createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask,
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
  const [notifSettings,setNotifSettings]= useState(null)
  const [notifLogs,    setNotifLogs]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [wsError,      setWsError]      = useState(null)

  useEffect(() => {
    if (!user) { setWorkspace(null); setProjects([]); setTasks([]); setLoading(false); return }
    setLoading(true)
    setWsError(null)

    // Safety timeout
    const timeout = setTimeout(() => setLoading(false), 8000)

    getMyWorkspace(user.id).then(ws => {
      clearTimeout(timeout)
      if (!ws) { setWsError('no_workspace'); setLoading(false); return }
      setWorkspace(ws)

      const unsubProjects = subscribeProjects(ws.id, (data) => { setProjects(data); setLoading(false) })
      const unsubTasks    = subscribeTasks(ws.id, setTasks)
      getNotifSettings(ws.id).then(setNotifSettings).catch(() => {})
      getNotifLogs(ws.id).then(setNotifLogs).catch(() => {})

      // Store unsub fns for cleanup — use a ref trick via closure
      window.__pulseUnsub = () => { unsubProjects(); unsubTasks() }
    }).catch(err => {
      clearTimeout(timeout)
      setWsError(err.message)
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      window.__pulseUnsub?.()
    }
  }, [user])

  // ─── Notifications ────────────────────────────────────────────────────────
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
    return createProject({ ...data, workspaceId: workspace.id, userId: user.id })
  }, [workspace, user])

  const editProject = useCallback(async (id, data) => updateProject(id, data), [])
  const removeProject = useCallback(async (id) => deleteProject(id), [])

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const addTask = useCallback(async (projectId, data) => {
    const task = await createTask({ projectId, workspaceId: workspace.id, userId: user.id, ...data })
    const project = projects.find(p => p.id === projectId)
    sendNotification({ trigger: 'new_task', task, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
    if (data.assignee_email) sendNotification({ trigger: 'task_assigned', task, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
    return task
  }, [workspace, user, projects, sendNotification])

  const editTask = useCallback(async (id, data, oldTask) => {
    await updateTask(id, data)
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

  const removeTask = useCallback(async (id) => deleteTask(id), [])

  // ─── Notif settings ───────────────────────────────────────────────────────
  const updateNotifSettings = useCallback(async (settings) => {
    await saveNotifSettings(workspace.id, settings)
    setNotifSettings(prev => ({ ...prev, ...settings }))
  }, [workspace])

  // ─── Derived ──────────────────────────────────────────────────────────────
  const getProjectTasks = useCallback((projectId) => tasks.filter(t => t.project_id === projectId), [tasks])

  const myTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))

  return (
    <DataContext.Provider value={{
      workspace, projects, tasks, notifSettings, notifLogs, loading, wsError,
      setWorkspace,
      addProject, editProject, removeProject,
      addTask, editTask, removeTask,
      updateNotifSettings, sendNotification,
      getProjectTasks, myTasks,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
