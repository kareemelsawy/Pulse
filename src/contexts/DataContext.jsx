import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeProjects, subscribeTask, subscribeTasks,
  createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask,
  getNotifSettings, saveNotifSettings,
  getNotifLogs, insertNotifLog,
} from '../lib/db'
import { sendGmail, buildNotificationEmail } from '../lib/gmail'
import { NOTIFICATION_TRIGGERS } from '../lib/constants'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [projects, setProjects]       = useState([])
  const [tasks, setTasks]             = useState([])
  const [notifSettings, setNotifSettings] = useState(null)
  const [notifLogs, setNotifLogs]     = useState([])
  const [loading, setLoading]         = useState(true)

  // Load everything when user logs in
  useEffect(() => {
    if (!user) { setProjects([]); setTasks([]); setLoading(false); return }
    setLoading(true)

    const unsubProjects = subscribeProjects(user.id, (data) => {
      setProjects(data)
      setLoading(false)
    })
    const unsubTasks = subscribeTasks(user.id, setTasks)

    getNotifSettings(user.id).then(s => setNotifSettings(s))
    getNotifLogs(user.id).then(setNotifLogs)

    return () => { unsubProjects(); unsubTasks() }
  }, [user])

  // ─── Notification dispatcher ───────────────────────────────────────────────
  const sendNotification = useCallback(async ({ trigger, task, projectName, actorName, extraInfo }) => {
    if (!notifSettings?.gmail_access_token) return
    if (!notifSettings?.enabled_triggers?.[trigger]) return

    const recipients = new Set()
    if (notifSettings.notify_assignee && task.assignee_email) recipients.add(task.assignee_email)
    if (notifSettings.extra_emails) {
      notifSettings.extra_emails.split(',').map(e => e.trim()).filter(Boolean).forEach(e => recipients.add(e))
    }
    if (!recipients.size) return

    const { subject, html } = buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo })
    let successes = 0, failures = 0

    await Promise.all([...recipients].map(async to => {
      try {
        await sendGmail(notifSettings.gmail_access_token, { to, subject, html })
        successes++
      } catch (e) {
        console.warn('Gmail send failed:', e.message)
        failures++
      }
    }))

    // Log it
    const log = {
      trigger,
      task_title: task.title,
      project_name: projectName,
      recipients: [...recipients],
      successes,
      failures,
      created_at: new Date().toISOString(),
    }
    await insertNotifLog(user.id, log)
    setNotifLogs(prev => [{ ...log, id: Date.now() }, ...prev].slice(0, 50))

    return { successes, failures }
  }, [notifSettings, user])

  // ─── Project actions ───────────────────────────────────────────────────────
  const addProject = useCallback(async (data) => {
    return createProject({ ...data, userId: user.id })
  }, [user])

  const editProject = useCallback(async (id, data) => {
    return updateProject(id, data)
  }, [])

  const removeProject = useCallback(async (id) => {
    return deleteProject(id)
  }, [])

  // ─── Task actions ──────────────────────────────────────────────────────────
  const addTask = useCallback(async (projectId, data) => {
    const task = await createTask({ projectId, userId: user.id, ...data })
    const project = projects.find(p => p.id === projectId)
    sendNotification({ trigger: 'new_task', task, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
    if (data.assignee_email) {
      sendNotification({ trigger: 'task_assigned', task, projectName: project?.name, actorName: user.user_metadata?.full_name || 'Someone' })
    }
    return task
  }, [user, projects, sendNotification])

  const editTask = useCallback(async (id, data, oldTask) => {
    await updateTask(id, data)
    const project = projects.find(p => p.id === (oldTask?.project_id))
    const newTask = { ...oldTask, ...data }

    if (oldTask?.status !== data.status) {
      const trigger = data.status === 'done' ? 'task_completed' : 'status_changed'
      sendNotification({
        trigger, task: newTask, projectName: project?.name,
        actorName: user.user_metadata?.full_name || 'Someone',
        extraInfo: `Status changed to "${data.status}"`,
      })
    }
    if (data.assignee_email && oldTask?.assignee_email !== data.assignee_email) {
      sendNotification({
        trigger: 'task_assigned', task: newTask, projectName: project?.name,
        actorName: user.user_metadata?.full_name || 'Someone',
      })
    }
  }, [user, projects, sendNotification])

  const removeTask = useCallback(async (id) => {
    return deleteTask(id)
  }, [])

  // ─── Notif settings ────────────────────────────────────────────────────────
  const updateNotifSettings = useCallback(async (settings) => {
    await saveNotifSettings(user.id, settings)
    setNotifSettings(prev => ({ ...prev, ...settings }))
  }, [user])

  // ─── Derived ───────────────────────────────────────────────────────────────
  const getProjectTasks = useCallback((projectId) => {
    return tasks.filter(t => t.project_id === projectId)
  }, [tasks])

  const myTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

  return (
    <DataContext.Provider value={{
      projects, tasks, notifSettings, notifLogs, loading,
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
