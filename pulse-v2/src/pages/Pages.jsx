// ─── OverviewPage ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { COLORS, STATUS, PRIORITY, ALL_TAGS, PROJECT_COLORS, NOTIFICATION_TRIGGERS } from '../lib/constants'
import { Avatar, Badge, ProgressBar, Modal, Toggle, Btn, iStyle, lStyle } from '../components/UI'
import { startGmailOAuth, parseOAuthToken, getGmailAddress } from '../lib/gmail'

export function OverviewPage({ onOpenProject, onNewProject }) {
  const { projects, tasks, getProjectTasks } = useData()
  const byStatus = Object.keys(STATUS).map(s => ({ s, count: tasks.filter(t => t.status === s).length }))
  const overdue  = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date())

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Good {hour()} ✦
          </h1>
          <p style={{ color: COLORS.textMuted }}>{projects.length} projects · {tasks.length} tasks total</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
          {byStatus.map(({ s, count }) => (
            <div key={s} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${STATUS[s].color}` }}>
              <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, marginBottom: 4 }}>{count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, letterSpacing: '0.04em' }}>{STATUS[s].label}</div>
            </div>
          ))}
        </div>

        {overdue.length > 0 && (
          <div style={{ background: '#450a0a', border: `1px solid ${COLORS.red}44`, borderRadius: 12, padding: '12px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠</span>
            <span style={{ color: '#fca5a5', fontSize: 13 }}><strong>{overdue.length}</strong> task{overdue.length > 1 ? 's are' : ' is'} overdue</span>
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
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
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
  const overdue  = myTasks.filter(t => t.due_date && new Date(t.due_date) < new Date())
  const rest     = myTasks.filter(t => !t.due_date || new Date(t.due_date) >= new Date())

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, marginBottom: 22, letterSpacing: '-0.03em' }}>My Tasks</h1>
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
  const { getProjectTasks, addTask, editTask, removeTask, editProject, removeProject } = useData()
  const tasks = getProjectTasks(project.id)
  const [view, setView]     = useState('board')
  const [search, setSearch] = useState('')
  const [filterS, setFilterS] = useState('all')
  const [taskModal, setTaskModal] = useState(null)
  const [editProjOpen, setEditProjOpen] = useState(false)

  const filtered = tasks.filter(t => {
    if (filterS !== 'all' && t.status !== filterS) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0 22px', height: 54, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 10, background: COLORS.surface, flexShrink: 0 }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: project.color }} />
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>{project.name}</h1>
        <button onClick={() => setEditProjOpen(true)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 13 }}>✎</button>
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
        <Btn size="sm" onClick={() => setTaskModal('new')}>+ Add Task</Btn>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', background: COLORS.surface, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Status:</span>
        <select value={filterS} onChange={e => setFilterS(e.target.value)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none' }}>
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
          onClose={() => setTaskModal(null)}
          toast={toast}
        />
      )}
      {editProjOpen && (
        <EditProjectModal
          project={project}
          onSave={async d => { await editProject(project.id, d); setEditProjOpen(false); toast('Project updated', 'success') }}
          onDelete={async () => { await removeProject(project.id); setEditProjOpen(false); toast('Project deleted') }}
          onClose={() => setEditProjOpen(false)}
        />
      )}
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
                  {t.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {t.tags.map(tag => <span key={tag} style={{ background: '#2A3F6F88', color: COLORS.accent, borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>{tag}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t.assignee_name ? <Avatar name={t.assignee_name} size={20} /> : <span />}
                    {t.due_date && <span style={{ fontSize: 10, color: COLORS.textMuted }}>{t.due_date}</span>}
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
function TaskModal({ task, projectId, onClose, toast }) {
  const { addTask, editTask, removeTask, members } = useData()
  const [title,   setTitle]   = useState(task?.title || '')
  const [status,  setStatus]  = useState(task?.status || 'todo')
  const [priority,setPriority]= useState(task?.priority || 'medium')
  const [assignee,setAssignee]= useState(task?.assignee_name || '')
  const [email,   setEmail]   = useState(task?.assignee_email || '')
  const [due,     setDue]     = useState(task?.due_date || '')
  const [tags,    setTags]    = useState(task?.tags || [])
  const [saving,  setSaving]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  // When a member is selected from dropdown, auto-fill name+email
  function handleMemberSelect(e) {
    const val = e.target.value
    if (!val) { setAssignee(''); setEmail(''); return }
    const member = members.find(m => m.user_id === val)
    if (member) {
      setAssignee(member.full_name || member.email || val)
      setEmail(member.email || '')
    }
  }

  // Find currently selected member
  const selectedMemberId = members.find(m =>
    (m.full_name && m.full_name === assignee) || (m.email && m.email === email)
  )?.user_id || ''

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const data = { title: title.trim(), status, priority, assignee_name: assignee, assignee_email: email, due_date: due, tags }
      if (task) { await editTask(task.id, data, task); toast?.('Task updated', 'success') }
      else      { await addTask(projectId, data);     toast?.('Task created', 'success') }
      onClose()
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await removeTask(task.id); toast?.('Task deleted'); onClose() }
    catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20 }}>{task ? 'Edit Task' : 'New Task'}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lStyle}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} style={{ ...iStyle, fontSize: 15, fontWeight: 500 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={iStyle}>
              {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={iStyle}>
              {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Assignee</label>
            {members.length > 0 ? (
              <>
                <select value={selectedMemberId} onChange={handleMemberSelect} style={{ ...iStyle, marginBottom: 6 }}>
                  <option value="">— Unassigned —</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name || m.email || m.user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                {!selectedMemberId && (
                  <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Or type a name" style={{ ...iStyle, fontSize: 12 }} />
                )}
              </>
            ) : (
              <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="e.g. Alex K." style={iStyle} />
            )}
          </div>
          <div>
            <label style={lStyle}>Assignee Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@company.com" type="email" style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Due Date</label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} style={iStyle} />
          </div>
        </div>
        <div>
          <label style={lStyle}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_TAGS.map(tag => {
              const on = tags.includes(tag)
              return <button key={tag} onClick={() => setTags(on ? tags.filter(t => t !== tag) : [...tags, tag])} style={{ background: on ? COLORS.accentDim : COLORS.bg, border: `1px solid ${on ? COLORS.accent : COLORS.border}`, color: on ? COLORS.accent : COLORS.textMuted, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{tag}</button>
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        {task && !confirmDel && <Btn variant="danger" onClick={() => setConfirmDel(true)}>Delete</Btn>}
        {task && confirmDel  && <Btn variant="danger" onClick={handleDelete} disabled={saving}>Confirm Delete</Btn>}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={saving || !title.trim()}>{saving ? '…' : task ? 'Save' : 'Create Task'}</Btn>
      </div>
    </Modal>
  )
}

// ─── NewProjectModal ─────────────────────────────────────────────────────────
export function NewProjectModal({ onClose, toast }) {
  const { addProject } = useData()
  const [name, setName]   = useState('')
  const [desc, setDesc]   = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try { await addProject({ name: name.trim(), description: desc, color }); toast?.('Project created!', 'success'); onClose() }
    catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20 }}>New Project</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lStyle}>Project Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this project about?" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5 }} />
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
function EditProjectModal({ project, onSave, onDelete, onClose }) {
  const [name,  setName]  = useState(project.name)
  const [desc,  setDesc]  = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20 }}>Edit Project</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lStyle}>Name</label><input value={name} onChange={e => setName(e.target.value)} style={iStyle} /></div>
        <div><label style={lStyle}>Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5 }} /></div>
        <div>
          <label style={lStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PROJECT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2 }} />)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        {!confirmDel ? <Btn variant="danger" onClick={() => setConfirmDel(true)}>Delete</Btn> : <Btn variant="danger" onClick={onDelete}>Confirm Delete</Btn>}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => name.trim() && onSave({ name, description: desc, color })}>Save</Btn>
      </div>
    </Modal>
  )
}

// ─── NotifModal ──────────────────────────────────────────────────────────────
export function NotifModal({ onClose, toast }) {
  const { notifSettings, notifLogs, updateNotifSettings, sendNotification, tasks, projects } = useData()
  const [tab, setTab]   = useState('setup')
  const [clientId, setClientId] = useState(notifSettings?.gmail_client_id || '')
  const [token,    setToken]    = useState(notifSettings?.gmail_access_token || null)
  const [email,    setEmail]    = useState(notifSettings?.gmail_email || null)
  const [triggers, setTriggers] = useState(notifSettings?.enabled_triggers || { task_assigned: true, status_changed: true, task_completed: true, new_task: false })
  const [notifyAssignee, setNotifyAssignee] = useState(notifSettings?.notify_assignee ?? true)
  const [extraEmails, setExtraEmails] = useState(notifSettings?.extra_emails || '')
  const [saving, setSaving] = useState(false)

  // Handle OAuth return after Gmail redirect
  useEffect(() => {
    const t = parseOAuthToken()
    if (t) {
      getGmailAddress(t).then(addr => {
        setToken(t); setEmail(addr)
        toast?.(`Gmail connected: ${addr}`, 'success')
      })
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateNotifSettings({ gmail_client_id: clientId, gmail_access_token: token, gmail_email: email, enabled_triggers: triggers, notify_assignee: notifyAssignee, extra_emails: extraEmails })
      toast?.('Settings saved', 'success')
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleTest() {
    const task = tasks[0]; const project = projects[0]
    if (!task || !project) { toast?.('No tasks to test with', 'error'); return }
    const result = await sendNotification({ trigger: 'task_assigned', task, projectName: project.name, actorName: 'Pulse Test', extraInfo: 'This is a test notification' })
    if (result) toast?.(`Test sent to ${result.successes} recipient(s)`, 'success')
    else toast?.('Gmail not connected yet', 'error')
  }

  return (
    <Modal onClose={onClose} width={540}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <GoogleIcon />
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17 }}>Gmail Notifications</h2>
        {email && <span style={{ marginLeft: 'auto', background: COLORS.green + '22', color: COLORS.green, border: `1px solid ${COLORS.green}44`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>Connected</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: COLORS.bg, borderRadius: 8, padding: 4 }}>
        {[['setup','Setup'],['triggers','Triggers'],['recipients','Recipients'],['log',`Log (${notifLogs.length})`]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, background: tab===k ? COLORS.surface : 'none', color: tab===k ? COLORS.text : COLORS.textMuted, border: tab===k ? `1px solid ${COLORS.border}` : '1px solid transparent', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {tab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.8 }}>
            <strong style={{ color: COLORS.textDim }}>How to set up:</strong>
            <ol style={{ paddingLeft: 18, marginTop: 6 }}>
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: COLORS.accent }}>Google Cloud Console</a></li>
              <li>Enable <strong style={{ color: COLORS.textDim }}>Gmail API</strong></li>
              <li>Create OAuth 2.0 credentials → Web App</li>
              <li>Add <code style={{ background: COLORS.border, padding: '1px 4px', borderRadius: 3 }}>{window.location.origin}</code> as authorized origin</li>
              <li>Paste Client ID below → Connect</li>
            </ol>
          </div>
          {!email ? (
            <>
              <div><label style={lStyle}>Google OAuth Client ID</label><input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxx.apps.googleusercontent.com" style={iStyle} /></div>
              <button onClick={() => { if (!clientId.trim()) { toast?.('Enter Client ID first', 'error'); return } startGmailOAuth(clientId.trim()) }} style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <GoogleIcon white /> Sign in with Google
              </button>
            </>
          ) : (
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.green}44`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>✉ Gmail Connected</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>{email}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn size="sm" onClick={handleTest}>Send Test Email</Btn>
                <Btn size="sm" variant="danger" onClick={() => { setToken(null); setEmail(null) }}>Disconnect</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'triggers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>Choose which events send an email.</p>
          {Object.entries(NOTIFICATION_TRIGGERS).map(([k, { label, desc }]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div><div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{desc}</div></div>
              <Toggle value={triggers[k]} onChange={v => setTriggers(t => ({ ...t, [k]: v }))} />
            </div>
          ))}
        </div>
      )}

      {tab === 'recipients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>Notify task assignee</div><div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Email whoever the task is assigned to</div></div>
            <Toggle value={notifyAssignee} onChange={setNotifyAssignee} />
          </div>
          <div><label style={lStyle}>Additional Emails (comma-separated)</label><input value={extraEmails} onChange={e => setExtraEmails(e.target.value)} placeholder="manager@co.com, ceo@co.com" style={iStyle} /></div>
        </div>
      )}

      {tab === 'log' && (
        <div>
          {notifLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>No emails sent yet</div>
          ) : notifLogs.map(l => (
            <div key={l.id} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge color={l.failures === 0 ? COLORS.green : COLORS.amber}>{l.successes}✓{l.failures > 0 ? ` ${l.failures}✕` : ''}</Badge>
                <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{l.task_title}</span>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(l.created_at).toLocaleTimeString()}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{NOTIFICATION_TRIGGERS[l.trigger]?.label} · {(l.recipients || []).join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
        {tab !== 'log' && <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Btn>}
      </div>
    </Modal>
  )
}

function GoogleIcon({ white }) {
  if (white) return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function hour() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' }
