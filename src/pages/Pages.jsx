import { useState, useCallback } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { DARK_THEME, STATUS, PRIORITY, PROJECT_COLORS, STATUS_FLOW } from '../lib/constants'
import { Icon, Btn, Modal, Badge, StatusBadge, PriorityBadge, ProgressBar, Avatar, iStyle, lStyle } from '../components/UI'
import GanttChart from '../components/GanttChart'

const C = DARK_THEME

// ─── OverviewPage ─────────────────────────────────────────────────────────────
export default function OverviewPage({ onSelectProject, toast }) {
  const { projects, tasks, loading, addProject } = useData()
  const [showNew, setShowNew] = useState(false)

  const projectStats = projects.map(p => {
    const ptasks = tasks.filter(t => t.project_id === p.id)
    const done = ptasks.filter(t => t.status === 'done').length
    return { ...p, taskCount: ptasks.length, doneCount: done, pct: ptasks.length ? Math.round(done / ptasks.length * 100) : 0 }
  })

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Overview</h1>
          <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>{projects.length} projects · {tasks.length} tasks</p>
        </div>
        <Btn onClick={() => setShowNew(true)} icon={<Icon name="plus" size={14} />}>New Project</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.textMuted }}>Loading…</div>
      ) : projects.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No projects yet</p>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>Create your first project to get started</p>
          <Btn onClick={() => setShowNew(true)} icon={<Icon name="plus" size={14} />}>Create Project</Btn>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projectStats.map((p, i) => (
            <div
              key={p.id}
              className="proj-card"
              onClick={() => onSelectProject(p)}
              style={{
                padding: '20px 22px', borderRadius: 14, cursor: 'pointer',
                background: C.bgCard, border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 11, color: C.textMuted }}>{p.taskCount} tasks</span>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.name}</h3>
              {p.description && <p style={{ margin: '0 0 14px', fontSize: 12, color: C.textMuted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
              <div style={{ marginTop: p.description ? 0 : 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Progress</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>{p.pct}%</span>
                </div>
                <ProgressBar value={p.doneCount} max={p.taskCount || 1} color={p.color || PROJECT_COLORS[i % PROJECT_COLORS.length]} height={4} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); toast?.('Project created', 'success') }} toast={toast} />}
    </div>
  )
}

// ─── ProjectView ──────────────────────────────────────────────────────────────
export function ProjectView({ project, subView, onSubView, toast }) {
  const { tasks, addTask, editTask, removeTask, getProjectTasks } = useData()
  const { user } = useAuth()
  const ptasks = getProjectTasks(project.id)
  const [showNewTask, setShowNewTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const views = ['board', 'list', 'gantt']

  return (
    <div style={{ padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: project.color || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {project.name[0].toUpperCase()}
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', margin: 0 }}>{project.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, gap: 2 }}>
            {views.map(v => (
              <button key={v} onClick={() => onSubView(v)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: subView === v ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: subView === v ? '#fff' : C.textMuted,
                fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.15s',
              }}>{v}</button>
            ))}
          </div>
          <Btn onClick={() => setShowNewTask(true)} icon={<Icon name="plus" size={14} />}>Add Task</Btn>
        </div>
      </div>

      {/* View */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {subView === 'board' && <BoardView tasks={ptasks} onEdit={setEditingTask} onStatusChange={(task, status) => editTask(task.id, { status }, task)} toast={toast} />}
        {subView === 'list'  && <ListView  tasks={ptasks} onEdit={setEditingTask} onDelete={id => removeTask(id).then(() => toast?.('Task deleted', 'success'))} toast={toast} />}
        {subView === 'gantt' && (
          <div className="gantt-wrapper" style={{ overflowX: 'auto' }}>
            <GanttChart rows={ptasks.map(t => ({ id: t.id, name: t.title, start: t.start_date, end: t.due_date, status: t.status }))} mode="tasks" title={project.name} />
          </div>
        )}
      </div>

      {showNewTask && (
        <TaskFormModal
          projectId={project.id}
          onClose={() => setShowNewTask(false)}
          onSave={async data => {
            try {
              await addTask(project.id, { ...data })
              setShowNewTask(false)
              toast?.('Task created', 'success')
            } catch { toast?.('Failed to create task', 'error') }
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          task={editingTask}
          projectId={project.id}
          onClose={() => setEditingTask(null)}
          onSave={async data => {
            try {
              await editTask(editingTask.id, data, editingTask)
              setEditingTask(null)
              toast?.('Task updated', 'success')
            } catch { toast?.('Failed to update task', 'error') }
          }}
        />
      )}
    </div>
  )
}

// ─── Board View ───────────────────────────────────────────────────────────────
function BoardView({ tasks, onEdit, onStatusChange, toast }) {
  const columns = Object.entries(STATUS)

  return (
    <div className="board-columns" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minHeight: 300 }}>
      {columns.map(([status, s]) => {
        const colTasks = tasks.filter(t => t.status === status)
        return (
          <div key={status} className="board-column" style={{
            flex: '1 1 220px', minWidth: 220,
            background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
              <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto' }}>{colTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colTasks.map(t => (
                <div key={t.id} className="task-card" onClick={() => onEdit(t)} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: C.bgCard, border: `1px solid ${C.border}`,
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#fff' }}>{t.title}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {t.priority && <PriorityBadge priority={t.priority} />}
                    {t.assignee_name && (
                      <span style={{ fontSize: 11, color: C.textMuted }}>{t.assignee_name}</span>
                    )}
                    {t.due_date && (
                      <span style={{ fontSize: 11, color: new Date(t.due_date) < new Date() ? '#fca5a5' : C.textMuted }}>
                        {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ tasks, onEdit, onDelete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tasks.length === 0 && <p style={{ color: C.textMuted, fontSize: 13, padding: '16px 0' }}>No tasks yet.</p>}
      {tasks.map(t => (
        <div key={t.id} className="list-row" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
          background: C.bgCard, border: `1px solid ${C.border}`,
        }}
          onClick={() => onEdit(t)}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS[t.status]?.color || C.border, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {t.priority && <PriorityBadge priority={t.priority} />}
            <StatusBadge status={t.status} />
            {t.assignee_name && <span style={{ fontSize: 11, color: C.textMuted }}>{t.assignee_name}</span>}
            {t.due_date && <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
            <button onClick={e => { e.stopPropagation(); onDelete(t.id) }} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 5 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.4)'}
            >✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── PipelineView ─────────────────────────────────────────────────────────────
export function PipelineView({ project, toast, onSubView }) {
  const { tasks, projects, addProject } = useData()

  const ganttRows = projects.map(p => ({
    id: p.id, name: p.name, start: p.start_date, end: p.end_date, status: p.status || 'active',
  }))

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', margin: 0 }}>Pipeline</h1>
        <Btn variant="secondary" onClick={() => onSubView('board')}>← Back to Board</Btn>
      </div>
      <div className="gantt-wrapper" style={{ overflowX: 'auto' }}>
        <GanttChart rows={ganttRows} mode="projects" title="All Projects" />
      </div>
    </div>
  )
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────
function TaskFormModal({ task, projectId, onClose, onSave }) {
  const { members } = useData()
  const [data, setData] = useState({
    title:          task?.title          || '',
    description:    task?.description    || '',
    status:         task?.status         || 'new',
    priority:       task?.priority       || '',
    assignee_email: task?.assignee_email || '',
    assignee_name:  task?.assignee_name  || '',
    due_date:       task?.due_date       || '',
    start_date:     task?.start_date     || '',
  })
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!data.title.trim()) return
    setLoading(true)
    await onSave(data)
    setLoading(false)
  }

  function f(key, val) { setData(d => ({ ...d, [key]: val })) }

  const is = iStyle()
  const ls = lStyle()

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose} width={520}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handle} loading={loading}>{task ? 'Save' : 'Create Task'}</Btn></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={ls}>Title</label>
          <input value={data.title} onChange={e => f('title', e.target.value)} placeholder="Task title" autoFocus style={is} />
        </div>
        <div>
          <label style={ls}>Description</label>
          <textarea value={data.description} onChange={e => f('description', e.target.value)} placeholder="Optional details…" rows={3} style={{ ...is, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={ls}>Status</label>
            <select value={data.status} onChange={e => f('status', e.target.value)} style={{ ...is, cursor: 'pointer' }}>
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={ls}>Priority</label>
            <select value={data.priority} onChange={e => f('priority', e.target.value)} style={{ ...is, cursor: 'pointer' }}>
              <option value="">None</option>
              {Object.entries(PRIORITY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={ls}>Assignee Name</label>
            <input value={data.assignee_name} onChange={e => f('assignee_name', e.target.value)} placeholder="Name" style={is} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={ls}>Assignee Email</label>
            <input value={data.assignee_email} onChange={e => f('assignee_email', e.target.value)} placeholder="email@company.com" type="email" style={is} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={ls}>Start Date</label>
            <input type="date" value={data.start_date} onChange={e => f('start_date', e.target.value)} style={{ ...is, colorScheme: 'dark' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={ls}>Due Date</label>
            <input type="date" value={data.due_date} onChange={e => f('due_date', e.target.value)} style={{ ...is, colorScheme: 'dark' }} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── New Project Modal ────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreated, toast }) {
  const { addProject } = useData()
  const [data, setData] = useState({ name: '', description: '', color: PROJECT_COLORS[0], start_date: '', end_date: '' })
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!data.name.trim()) return
    setLoading(true)
    try {
      await addProject(data)
      onCreated()
    } catch { toast?.('Failed to create project', 'error') }
    setLoading(false)
  }

  const is = iStyle()
  const ls = lStyle()

  return (
    <Modal title="New Project" onClose={onClose} width={460}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handle} loading={loading}>Create Project</Btn></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={ls}>Project Name</label>
          <input value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))} placeholder="Project name" autoFocus style={is} />
        </div>
        <div>
          <label style={ls}>Description</label>
          <textarea value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} placeholder="Optional" rows={2} style={{ ...is, resize: 'vertical' }} />
        </div>
        <div>
          <label style={ls}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROJECT_COLORS.map(c => (
              <button key={c} onClick={() => setData(d => ({ ...d, color: c }))} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${data.color === c ? '#fff' : 'transparent'}`,
                cursor: 'pointer', transition: 'border-color 0.15s',
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={ls}>Start Date</label>
            <input type="date" value={data.start_date} onChange={e => setData(d => ({ ...d, start_date: e.target.value }))} style={{ ...is, colorScheme: 'dark' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={ls}>End Date</label>
            <input type="date" value={data.end_date} onChange={e => setData(d => ({ ...d, end_date: e.target.value }))} style={{ ...is, colorScheme: 'dark' }} />
          </div>
        </div>
      </div>
    </Modal>
  )
}
