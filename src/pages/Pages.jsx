import { useState, useEffect, useRef } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS, STATUS, STATUS_FLOW, PRIORITY, PROJECT_COLORS } from '../lib/constants'
import { Avatar, Badge, ProgressBar, Modal, Btn, iStyle, lStyle } from '../components/UI'
import { getComments, addComment, deleteComment } from '../lib/db'

// ─── OverviewPage ─────────────────────────────────────────────────────────────
export function OverviewPage({ onOpenProject, onNewProject }) {
  const { projects, tasks, getProjectTasks } = useData()
  const byStatus = Object.keys(STATUS).map(s => ({ s, count: tasks.filter(t => t.status === s).length }))
  const overdue  = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date())

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em', marginBottom: 6, paddingBottom: 2 }}>
            Good {hour()} ✦
          </h1>
          <p style={{ color: COLORS.textMuted }}>{projects.length} projects · {tasks.length} tasks total</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
          {byStatus.map(({ s, count }) => (
            <div key={s} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${STATUS[s].color}` }}>
              <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>{count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, letterSpacing: '0.04em' }}>{STATUS[s].label}</div>
            </div>
          ))}
        </div>

        {overdue.length > 0 && (
          <div style={{ background: COLORS.red + '18', border: `1px solid ${COLORS.red}44`, borderRadius: 12, padding: '12px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠</span>
            <span style={{ color: COLORS.red, fontSize: 13 }}><strong>{overdue.length}</strong> task{overdue.length > 1 ? 's are' : ' is'} overdue</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontWeight: 700, fontSize: 14, color: COLORS.textDim }}>All Projects</h2>
          <Btn size="sm" onClick={onNewProject}>+ New Project</Btn>
        </div>

        {projects.length === 0 ? (
          <div style={{ background: COLORS.surface, border: `2px dashed ${COLORS.border}`, borderRadius: 16, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>◈</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No projects yet</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>Create your first project to get started</div>
            <Btn onClick={onNewProject}>+ Create Project</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {projects.map(p => {
              const ptasks = getProjectTasks(p.id)
              const ov = ptasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length
              return (
                <div key={p.id} onClick={() => onOpenProject(p)}
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, cursor: 'pointer', borderLeft: `4px solid ${p.color}`, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = COLORS.cardShadow }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>{p.description}</div>}
                  <ProgressBar tasks={ptasks} />
                  {ov > 0 && <div style={{ marginTop: 8, fontSize: 11, color: COLORS.red, fontWeight: 600 }}>⚠ {ov} overdue</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MyTasksPage ─────────────────────────────────────────────────────────────
export function MyTasksPage() {
  const { myTasks, projects } = useData()
  const { user } = useAuth()
  const overdue = myTasks.filter(t => t.due_date && new Date(t.due_date) < new Date())
  const rest    = myTasks.filter(t => !t.due_date || new Date(t.due_date) >= new Date())

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, marginBottom: 22, letterSpacing: '-0.03em', paddingBottom: 2 }}>My Tasks</h1>
        {myTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>All caught up!</div>
          </div>
        ) : (
          [['⚠ Overdue', overdue], ['Upcoming', rest]].map(([label, list]) => list.length === 0 ? null : (
            <div key={label} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: label.includes('Overdue') ? COLORS.red : COLORS.textMuted, marginBottom: 8 }}>{label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {list.map(t => {
                  const proj = projects.find(p => p.id === t.project_id)
                  return (
                    <div key={t.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {proj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{proj?.name}{t.due_date ? ` · Due ${t.due_date}` : ''}</div>
                      </div>
                      <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── ProjectView ─────────────────────────────────────────────────────────────
export function ProjectView({ project, toast }) {
  const { getProjectTasks, addTask, editTask, removeTask, editProject, removeProject, workspace } = useData()
  const { user } = useAuth()
  const isAdmin = workspace?.role === 'owner' || workspace?.owner_id === user?.id
  const tasks = getProjectTasks(project.id)
  const [view, setView]     = useState('board')
  const [search, setSearch] = useState('')
  const [filterS, setFilterS] = useState('all')
  const [taskModal, setTaskModal] = useState(null)
  const [editProjOpen, setEditProjOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)

  const filtered = tasks.filter(t => {
    if (filterS !== 'all' && t.status !== filterS) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '0 22px', height: 54, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 10, background: COLORS.surface, flexShrink: 0 }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: project.color }} />
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', paddingBottom: 1 }}>{project.name}</h1>
        <button onClick={() => setEditProjOpen(true)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 13, padding: '2px 6px' }}>✎</button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '5px 10px', width: 180 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: 'none', border: 'none', color: COLORS.text, fontSize: 13, width: '100%', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[['⊟','list'],['⊞','board']].map(([ic,v]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 11px', background: view===v ? COLORS.border : 'none', color: view===v ? COLORS.text : COLORS.textMuted, fontSize: 14, border: 'none', cursor: 'pointer' }}>{ic}</button>
          ))}
        </div>
        <Btn size="sm" variant="secondary" onClick={() => setCsvOpen(true)}>↑ CSV</Btn>
        <Btn size="sm" onClick={() => setTaskModal('new')}>+ Add Task</Btn>
      </div>

      <div style={{ padding: '8px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', background: COLORS.surface, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Status:</span>
        <select value={filterS} onChange={e => setFilterS(e.target.value)} style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none' }}>
          <option value="all">All</option>
          {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 4 }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 22 }}>
        {view === 'board' ? <BoardView tasks={filtered} onTaskClick={setTaskModal} /> : <ListView tasks={filtered} onTaskClick={setTaskModal} />}
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          projectId={project.id}
          isAdmin={isAdmin}
          onClose={() => setTaskModal(null)}
          toast={toast}
        />
      )}
      {editProjOpen && (
        <EditProjectModal
          project={project}
          isAdmin={isAdmin}
          onSave={async d => { await editProject(project.id, d); setEditProjOpen(false); toast('Project updated', 'success') }}
          onDelete={async () => { await removeProject(project.id); setEditProjOpen(false); toast('Project deleted') }}
          onClose={() => setEditProjOpen(false)}
        />
      )}
      {csvOpen && <CsvImportModal projectId={project.id} onClose={() => setCsvOpen(false)} toast={toast} />}
    </div>
  )
}

function BoardView({ tasks, onTaskClick }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {Object.entries(STATUS).map(([sk, sm]) => {
        const col = tasks.filter(t => t.status === sk)
        return (
          <div key={sk} style={{ flex: '0 0 260px', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 15px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sm.color }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>{sm.label}</span>
              <span style={{ marginLeft: 'auto', background: COLORS.border, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>{col.length}</span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
              {col.map(t => (
                <div key={t.id} onClick={() => onTaskClick(t)}
                  style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '11px 13px', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = COLORS.surfaceHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = COLORS.bg; e.currentTarget.style.transform = '' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.4 }}>{t.title}</span>
                    <span style={{ color: PRIORITY[t.priority]?.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{PRIORITY[t.priority]?.icon}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t.assignee_name ? <Avatar name={t.assignee_name} size={20} /> : <span />}
                    {t.due_date && <span style={{ fontSize: 10, color: COLORS.textMuted }}>{t.due_date}</span>}
                  </div>
                  {/* Next step button */}
                  {sm.next && <NextStepButton task={t} />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NextStepButton({ task }) {
  const { editTask } = useData()
  const next = STATUS[task.status]?.next
  if (!next) return null
  return (
    <button
      onClick={e => { e.stopPropagation(); editTask(task.id, { status: next }, task) }}
      style={{ marginTop: 8, width: '100%', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 0', fontSize: 11, color: COLORS.textMuted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = COLORS.accent + '22'; e.currentTarget.style.color = COLORS.accent; e.currentTarget.style.borderColor = COLORS.accent }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = COLORS.textMuted; e.currentTarget.style.borderColor = COLORS.border }}>
      → {STATUS[next].label}
    </button>
  )
}

function ListView({ tasks, onTaskClick }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 90px 90px', padding: '9px 15px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>Task</span><span>Status</span><span>Assignee</span><span>Priority</span><span>Due</span>
      </div>
      {tasks.map((t, i) => (
        <div key={t.id} onClick={() => onTaskClick(t)}
          style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 90px 90px', padding: '11px 15px', borderBottom: i < tasks.length-1 ? `1px solid ${COLORS.border}` : 'none', cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = ''}>
          <span style={{ fontWeight: 500, paddingRight: 12 }}>{t.title}</span>
          <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.assignee_name && <><Avatar name={t.assignee_name} size={20} /><span style={{ fontSize: 12, color: COLORS.textDim }}>{t.assignee_name.split(' ')[0]}</span></>}
          </div>
          <span style={{ color: PRIORITY[t.priority]?.color, fontSize: 12, fontWeight: 600 }}>{PRIORITY[t.priority]?.icon} {PRIORITY[t.priority]?.label}</span>
          <span style={{ fontSize: 12, color: t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' ? COLORS.red : COLORS.textMuted }}>{t.due_date}</span>
        </div>
      ))}
      {!tasks.length && <div style={{ padding: 36, textAlign: 'center', color: COLORS.textMuted }}>No tasks found</div>}
    </div>
  )
}

// ─── TaskModal ───────────────────────────────────────────────────────────────
function TaskModal({ task, projectId, isAdmin, onClose, toast }) {
  const { addTask, editTask, removeTask, members: ctxMembers, workspace } = useData()
  const { user } = useAuth()
  const [tab,        setTab]        = useState('details')
  const [title,      setTitle]      = useState(task?.title || '')
  const [status,     setStatus]     = useState(task?.status || 'new')
  const [priority,   setPriority]   = useState(task?.priority || 'medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [due,        setDue]        = useState(task?.due_date || '')
  const [saving,     setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [localMembers, setLocalMembers] = useState([])

  // Comments
  const [comments,     setComments]     = useState([])
  const [commentText,  setCommentText]  = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [savingComment,   setSavingComment]   = useState(false)

  // Fetch members fresh every time modal opens so dropdown is always populated
  useEffect(() => {
    if (ctxMembers?.length > 0) {
      setLocalMembers(ctxMembers)
      // Pre-select assignee for existing task
      if (task?.assignee_email) {
        const match = ctxMembers.find(m => m.email === task.assignee_email)
        if (match) setAssigneeId(match.user_id)
      }
    } else if (workspace?.id) {
      import('../lib/db').then(({ getWorkspaceMembers }) => {
        getWorkspaceMembers(workspace.id).then(ms => {
          setLocalMembers(ms)
          if (task?.assignee_email) {
            const match = ms.find(m => m.email === task.assignee_email)
            if (match) setAssigneeId(match.user_id)
          }
        }).catch(() => {})
      })
    }
  }, [])

  useEffect(() => {
    if (task && tab === 'comments') {
      setLoadingComments(true)
      getComments(task.id)
        .then(c => { setComments(c); setLoadingComments(false) })
        .catch(() => setLoadingComments(false))
    }
  }, [task, tab])

  const selectedMember = localMembers.find(m => m.user_id === assigneeId)

  // Admins can jump to any status; non-admins can only move one step forward
  const allowedStatuses = task
    ? (isAdmin ? STATUS_FLOW : STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(task.status) + 2))
    : ['new']

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const assignee_name  = selectedMember?.full_name || selectedMember?.email || ''
      const assignee_email = selectedMember?.email || ''
      // Always explicitly pass 'new' for new tasks — never undefined
      const safeStatus = task ? (status || task.status || 'new') : 'new'
      const data = {
        title: title.trim(),
        status: safeStatus,
        priority: priority || 'medium',
        assignee_name,
        assignee_email,
        due_date: due || null,
      }
      if (task) { await editTask(task.id, data, task); toast?.('Task updated', 'success') }
      else      { await addTask(projectId, data);      toast?.('Task created', 'success') }
      onClose()
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await removeTask(task.id); toast?.('Task deleted'); onClose() }
    catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return
    setSavingComment(true)
    try {
      const c = await addComment(task.id, user.id, commentText.trim())
      const authorName = user?.user_metadata?.full_name || user?.email || 'You'
      setComments(prev => [...prev, { ...c, author_name: authorName }])
      setCommentText('')
    } catch(e) { toast?.(e.message, 'error') } finally { setSavingComment(false) }
  }

  async function handleDeleteComment(id) {
    try { await deleteComment(id); setComments(prev => prev.filter(c => c.id !== id)) }
    catch(e) { toast?.(e.message, 'error') }
  }

  return (
    <Modal onClose={onClose} width={560}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 16, paddingBottom: 2 }}>{task ? 'Edit Task' : 'New Task'}</h2>

      <div style={{ display: 'flex', gap: 2, marginBottom: 18, background: COLORS.bg, borderRadius: 8, padding: 3 }}>
        {[['details','Details'],['comments', task ? `Comments (${comments.length})` : 'Comments'],['attachments','Attachments']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, background: tab===k ? COLORS.surface : 'none', color: tab===k ? COLORS.text : COLORS.textMuted, border: tab===k ? `1px solid ${COLORS.border}` : '1px solid transparent', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {tab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lStyle}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{ ...iStyle, fontSize: 15, fontWeight: 500, background: COLORS.inputBg }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {task && (
              <div>
                <label style={lStyle}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...iStyle, background: COLORS.inputBg }}>
                  {allowedStatuses.map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}
                </select>
                {!isAdmin && <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Tasks move forward one step at a time</p>}
              </div>
            )}

            <div>
              <label style={lStyle}>Priority</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(PRIORITY).map(([k, v]) => (
                  <button key={k} onClick={() => setPriority(k)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${priority === k ? v.color : COLORS.border}`,
                      background: priority === k ? v.color + '22' : COLORS.bg,
                      color: priority === k ? v.color : COLORS.textMuted,
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                      fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 16 }}>{v.icon === '↑↑' ? '🔴' : v.icon === '↑' ? '🟡' : '🟢'}</span>
                    <span style={{ fontSize: 10 }}>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: task ? 'auto' : '1 / -1' }}>
              <label style={lStyle}>Assignee</label>
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                style={{ ...iStyle, background: COLORS.inputBg }}>
                <option value="">— Unassigned —</option>
                {localMembers.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name && m.email ? `${m.full_name} (${m.email})` : m.full_name || m.email || m.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
              {localMembers.length === 0 && (
                <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                  No members found — make sure the <code>profiles</code> table is set up (run the full SQL script)
                </p>
              )}
            </div>

            <div>
              <label style={lStyle}>Due Date</label>
              <input type="date" value={due} onChange={e => setDue(e.target.value)}
                style={{ ...iStyle, background: COLORS.inputBg }} />
            </div>
          </div>

          {!task && (
            <div style={{ background: COLORS.accent + '18', border: `1px solid ${COLORS.accent}33`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: COLORS.textMuted }}>
              ℹ New tasks start as <strong style={{ color: COLORS.text }}>New</strong> and move through: New → In Progress → Review → Done
            </div>
          )}
        </div>
      )}

      {tab === 'comments' && !task && (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: COLORS.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Create the task first</div>
          <p style={{ fontSize: 12 }}>Save this task, then open it to add comments.</p>
        </div>
      )}

      {tab === 'comments' && task && (
        <div>
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {loadingComments ? (
              <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: 24 }}>Loading…</div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>No comments yet
              </div>
            ) : comments.map(c => (
              <div key={c.id} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar name={c.author_name} size={22} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author_name}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' }}>{new Date(c.created_at).toLocaleString()}</span>
                  {(c.user_id === user?.id || isAdmin) && (
                    <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>✕</button>
                  )}
                </div>
                <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.body}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment…" rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddComment() }}
              style={{ ...iStyle, flex: 1, resize: 'none', lineHeight: 1.5, background: COLORS.inputBg }} />
            <Btn onClick={handleAddComment} disabled={savingComment || !commentText.trim()}>Post</Btn>
          </div>
          <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>⌘+Enter to post</p>
        </div>
      )}

      {tab === 'attachments' && !task && (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: COLORS.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📎</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Create the task first</div>
          <p style={{ fontSize: 12 }}>Save this task, then open it to add attachments.</p>
        </div>
      )}

      {tab === 'attachments' && task && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: COLORS.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📎</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>File Attachments</div>
          <p style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 16px' }}>
            To enable file attachments, create a Supabase Storage bucket named <code style={{ background: COLORS.border, padding: '1px 5px', borderRadius: 3 }}>task-attachments</code> and set it to public.
          </p>
          <Btn size="sm" variant="secondary" onClick={() => window.open('https://supabase.com/dashboard', '_blank')}>Open Supabase Storage →</Btn>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        {tab === 'details' && task && isAdmin && !confirmDel && <Btn variant="danger" onClick={() => setConfirmDel(true)}>Delete</Btn>}
        {tab === 'details' && task && isAdmin && confirmDel  && <Btn variant="danger" onClick={handleDelete} disabled={saving}>Confirm Delete</Btn>}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Close</Btn>
        {tab === 'details' && <Btn onClick={handleSave} disabled={saving || !title.trim()}>{saving ? '…' : task ? 'Save' : 'Create Task'}</Btn>}
      </div>
    </Modal>
  )
}
// ─── NewProjectModal ─────────────────────────────────────────────────────────
export function NewProjectModal({ onClose, toast }) {
  const { addProject } = useData()
  const [name,   setName]   = useState('')
  const [desc,   setDesc]   = useState('')
  const [color,  setColor]  = useState(PROJECT_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try { await addProject({ name: name.trim(), description: desc, color }); toast?.('Project created!', 'success'); onClose() }
    catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20, paddingBottom: 2 }}>New Project</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lStyle}>Project Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} style={{ ...iStyle, background: COLORS.inputBg }} />
        </div>
        <div>
          <label style={lStyle}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this project about?" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5, background: COLORS.inputBg }} />
        </div>
        <div>
          <label style={lStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PROJECT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'all 0.15s' }} />)}
          </div>
          <div style={{ marginTop: 10, padding: '9px 13px', background: COLORS.bg, borderLeft: `4px solid ${color}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: COLORS.textDim }}>{name || 'Preview'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn onClick={handleCreate} disabled={saving || !name.trim()}>{saving ? 'Creating…' : 'Create Project'}</Btn>
      </div>
    </Modal>
  )
}

// ─── EditProjectModal ────────────────────────────────────────────────────────
function EditProjectModal({ project, isAdmin, onSave, onDelete, onClose }) {
  const [name,  setName]  = useState(project.name)
  const [desc,  setDesc]  = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20, paddingBottom: 2 }}>Edit Project</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lStyle}>Name</label><input value={name} onChange={e => setName(e.target.value)} style={{ ...iStyle, background: COLORS.inputBg }} /></div>
        <div><label style={lStyle}>Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5, background: COLORS.inputBg }} /></div>
        <div>
          <label style={lStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PROJECT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2 }} />)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        {isAdmin && !confirmDel && <Btn variant="danger" onClick={() => setConfirmDel(true)}>Delete Project</Btn>}
        {isAdmin && confirmDel  && <Btn variant="danger" onClick={onDelete}>Confirm Delete</Btn>}
        {!isAdmin && <span style={{ fontSize: 12, color: COLORS.textMuted, alignSelf: 'center' }}>Only admins can delete projects</span>}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => name.trim() && onSave({ name, description: desc, color })}>Save</Btn>
      </div>
    </Modal>
  )
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────
function CsvImportModal({ projectId, onClose, toast }) {
  const { importTasks, projects } = useData()
  const [mode,     setMode]     = useState('tasks') // 'tasks'
  const [preview,  setPreview]  = useState(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef()

  const project = projects.find(p => p.id === projectId)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      const rows = parseCsv(text)
      setPreview(rows)
    }
    reader.readAsText(file)
  }

  function parseCsvLine(line) {
    const vals = []; let cur = ''; let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    vals.push(cur.trim())
    return vals
  }

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''))
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = parseCsvLine(line)
      const row = {}
      headers.forEach((h, i) => { row[h] = (vals[i] || '').replace(/"/g, '') })
      return row
    }).filter(r => r.title || r.name)
  }

  async function handleImport() {
    if (!preview?.length) return
    setImporting(true)
    try {
      const projectMap = { [project?.name || '']: projectId }
      const normalized = preview.map(r => ({
        title: r.title || r.name || 'Untitled',
        priority: ['high','medium','low'].includes(r.priority?.toLowerCase()) ? r.priority.toLowerCase() : 'medium',
        assignee_name: r.assignee_name || r.assignee || '',
        assignee_email: r.assignee_email || r.email || '',
        due_date: r.due_date || r.due || '',
        project_name: project?.name || '',
      }))
      const created = await importTasks(normalized, projectMap)
      toast(`${created.length} tasks imported!`, 'success')
      onClose()
    } catch(e) { toast(e.message, 'error') } finally { setImporting(false) }
  }

  return (
    <Modal onClose={onClose} width={560}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 6, paddingBottom: 2 }}>📥 CSV Import</h2>
      <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>Import tasks into <strong style={{ color: COLORS.text }}>{project?.name}</strong></p>

      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.8 }}>
        <strong style={{ color: COLORS.textDim }}>Expected CSV columns:</strong><br />
        <code style={{ color: COLORS.accent }}>title, priority, assignee_name, assignee_email, due_date</code><br />
        <span>• <strong>title</strong> — required</span><br />
        <span>• <strong>priority</strong> — high / medium / low (default: medium)</span><br />
        <span>• <strong>due_date</strong> — YYYY-MM-DD format</span><br />
        <span>• All tasks start as <strong>New</strong></span>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.background = COLORS.accent + '08' }}
        onDragLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'none' }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'none'; const file = e.dataTransfer.files[0]; if (file) { const reader = new FileReader(); reader.onload = ev => setPreview(parseCsv(ev.target.result)); reader.readAsText(file) } }}
        style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: '24px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to select or drag & drop a CSV</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Accepts .csv files</div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {preview && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, marginBottom: 8 }}>✓ {preview.length} rows detected</div>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 100px', padding: '7px 12px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Title</span><span>Priority</span><span>Assignee</span><span>Due</span>
            </div>
            {preview.slice(0, 10).map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 100px', padding: '7px 12px', borderBottom: i < Math.min(preview.length, 10) - 1 ? `1px solid ${COLORS.border}` : 'none', fontSize: 12 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || r.name}</span>
                <span style={{ color: PRIORITY[r.priority?.toLowerCase()]?.color || COLORS.textMuted }}>{r.priority || 'medium'}</span>
                <span style={{ color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.assignee_name || r.assignee || '—'}</span>
                <span style={{ color: COLORS.textMuted }}>{r.due_date || r.due || '—'}</span>
              </div>
            ))}
            {preview.length > 10 && <div style={{ padding: '6px 12px', fontSize: 11, color: COLORS.textMuted }}>…and {preview.length - 10} more rows</div>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="data:text/csv;charset=utf-8,title,priority,assignee_name,assignee_email,due_date%0AExample Task,high,John Doe,john@co.com,2025-12-31%0AAnother Task,medium,Jane Smith,jane@co.com," download="pulse-tasks-template.csv" style={{ fontSize: 12, color: COLORS.accent }}>⬇ Download template</a>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleImport} disabled={!preview?.length || importing}>{importing ? 'Importing…' : `Import ${preview?.length || 0} Tasks`}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── NotifModal (kept for backward compat) ───────────────────────────────────
export function NotifModal({ onClose, toast }) {
  onClose()
  return null
}

function hour() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' }
