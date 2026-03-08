import { useState, useRef } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS, STATUS, PRIORITY, PROJECT_COLORS } from '../lib/constants'
import { Avatar, Badge, ProgressBar, Modal, Btn, Icon, lStyle, iStyle } from '../components/UI'
import { exportTasksCsv } from '../lib/db/tasks'
import { getMeetings, deleteMeeting } from '../lib/db/meetings'
import { BoardView, ListView } from '../components/TaskViews'
import GanttChart from '../components/GanttChart'
import TaskModal from '../components/TaskModal'
import MeetingCard from '../components/MeetingCard'
import MeetingModal from '../components/MeetingModal'

// ─── HomePage (merged Overview + My Tasks) ────────────────────────────────────
export function HomePage({ onOpenProject, onNewProject, workspaceName }) {
  const { projects, tasks, myTasks, getProjectTasks } = useData()
  const { user } = useAuth()
  const firstName  = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there').split(' ')[0]
  const myEmail    = user?.email
  const byStatus   = Object.keys(STATUS).map(s => ({ s, count: tasks.filter(t => t.status === s).length }))
  const overdue    = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date())
  const myOverdue  = myTasks.filter(t => t.due_date && new Date(t.due_date) < new Date())
  const myUpcoming = myTasks.filter(t => !t.due_date || new Date(t.due_date) >= new Date())

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 1100 }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', margin: 0 }}>
              Hey {firstName}, good {hour()}
            </h1>
            <Icon name={hourIcon()} size={20} color={COLORS.textMuted} />
          </div>
          {workspaceName && <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4 }}>{workspaceName}</div>}
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{projects.length} projects · {tasks.length} tasks total</p>
        </div>

        {/* Workspace status cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {byStatus.map(({ s, count }) => (
            <div key={s} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${STATUS[s].color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>{count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, letterSpacing: '0.04em' }}>{STATUS[s].label}</div>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div style={{ background: COLORS.red + '18', border: `1px solid ${COLORS.red}44`, borderRadius: 12, padding: '12px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="warning" size={16} color={COLORS.red} />
            <span style={{ color: COLORS.red, fontSize: 13 }}><strong>{overdue.length}</strong> task{overdue.length > 1 ? 's are' : ' is'} overdue across all projects</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Left — Projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontWeight: 600, fontSize: 13, color: COLORS.textDim, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>Projects</h2>
              <Btn size="sm" onClick={onNewProject}>+ New Project</Btn>
            </div>
            {projects.length === 0 ? (
              <div style={{ background: COLORS.surface, border: `2px dashed ${COLORS.border}`, borderRadius: 16, padding: 48, textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No projects yet</div>
                <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>Create your first project to get started</div>
                <Btn onClick={onNewProject}>+ Create Project</Btn>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                {projects.filter(p => !p.is_pipeline).map(p => {
                  const ptasks = getProjectTasks(p.id)
                  const ov = ptasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length
                  return (
                    <div key={p.id} onClick={() => onOpenProject(p)}
                      style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 18, cursor: 'pointer', borderLeft: `4px solid ${p.color}`, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = COLORS.cardShadow }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10, lineHeight: 1.5 }}>{p.description}</div>}
                      <ProgressBar tasks={ptasks} />
                      {ov > 0 && <div style={{ marginTop: 8, fontSize: 11, color: COLORS.red, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="warning" size={11} color={COLORS.red} /> {ov} overdue</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right — My Tasks */}
          <div>
            <h2 style={{ fontWeight: 600, fontSize: 13, color: COLORS.textDim, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px' }}>My Tasks</h2>
            {myTasks.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
                <Icon name="check" size={28} color={COLORS.green} />
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 10 }}>All caught up!</div>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>No open tasks assigned to you</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['Overdue', myOverdue], ['Upcoming', myUpcoming]].map(([label, list]) => list.length === 0 ? null : (
                  <div key={label}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: label === 'Overdue' ? COLORS.red : COLORS.textMuted, marginBottom: 8 }}>{label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {list.map(t => {
                        const proj = projects.find(p => p.id === t.project_id)
                        return (
                          <div key={t.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            {proj && <div style={{ width: 7, height: 7, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{proj?.name}{t.due_date ? ` · Due ${t.due_date}` : ''}</div>
                            </div>
                            <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep OverviewPage as alias for backward compatibility
export const OverviewPage = HomePage

// ─── ProjectView ─────────────────────────────────────────────────────────────
export function ProjectView({ project, toast }) {
  const { getProjectTasks, editProject, removeProject, workspace } = useData()
  const { user } = useAuth()
  const isAdmin = workspace?.role === 'owner' || workspace?.owner_id === user?.id
  const tasks = getProjectTasks(project.id)
  const [view,         setView]         = useState('board')
  const [search,       setSearch]       = useState('')
  const [filterS,      setFilterS]      = useState('all')
  const [taskModal,    setTaskModal]    = useState(null)
  const [editProjOpen, setEditProjOpen] = useState(false)
  const [csvOpen,      setCsvOpen]      = useState(false)
  const [mainTab,      setMainTab]      = useState('tasks')

  const filtered = tasks.filter(t => {
    if (filterS !== 'all' && t.status !== filterS) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '0 22px', height: 54, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
        <h1 style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', paddingBottom: 1 }}>{project.name}</h1>
        <button onClick={() => setEditProjOpen(true)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center' }}><Icon name="edit" size={14} color={COLORS.textMuted} /></button>
        <div style={{ display: 'flex', gap: 2, marginLeft: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 3 }}>
          {[['tasks','Tasks'],['meetings','Meetings']].map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)} style={{ padding: '4px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: mainTab === id ? COLORS.surface : 'none', color: mainTab === id ? COLORS.text : COLORS.textMuted, transition: 'all 0.15s', boxShadow: mainTab === id ? `0 1px 3px ${COLORS.shadow}` : 'none' }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {mainTab === 'tasks' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '5px 10px', width: 180 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 12 }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: 'none', border: 'none', color: COLORS.text, fontSize: 13, width: '100%', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {[['list','list'],['board','board']].map(([ic,v]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 9px', background: view===v ? COLORS.border : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon name={ic} size={14} color={view===v ? COLORS.text : COLORS.textMuted} /></button>
            ))}
          </div>
          <Btn size="sm" variant="secondary" onClick={() => setCsvOpen(true)}>↑ Import</Btn>
          <Btn size="sm" variant="secondary" onClick={() => exportTasksCsv(filtered, project?.name)}>↓ Export</Btn>
          <Btn size="sm" onClick={() => setTaskModal('new')}>+ Add Task</Btn>
        </>)}
      </div>

      {mainTab === 'tasks' && (
        <div style={{ padding: '8px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>Status:</span>
          <select value={filterS} onChange={e => setFilterS(e.target.value)} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', color: COLORS.textDim, borderRadius: 8, padding: '4px 8px', fontSize: 12, outline: 'none' }}>
            <option value="all">All</option>
            {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 4 }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: mainTab === 'meetings' ? 0 : 22, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {mainTab === 'tasks' && filtered.some(t => t.due_date) && (
          <div style={{ marginBottom: 18 }}>
            <GanttChart
              title={`${project.name} — Timeline`}
              mode="tasks"
              rows={filtered.filter(t => t.due_date).map(t => ({
                id: t.id, label: t.title, status: t.status,
                start: t.created_at?.split('T')[0] || t.due_date,
                end: t.due_date,
              }))}
            />
          </div>
        )}
        {mainTab === 'tasks' && view === 'board' && <BoardView tasks={filtered} onTaskClick={setTaskModal} />}
        {mainTab === 'tasks' && view === 'list'  && <ListView tasks={filtered} onTaskClick={setTaskModal} />}
        {mainTab === 'meetings' && <MeetingsTab project={project} toast={toast} />}
      </div>

      {taskModal && <TaskModal task={taskModal === 'new' ? null : taskModal} projectId={project.id} isAdmin={isAdmin} onClose={() => setTaskModal(null)} toast={toast} />}
      {editProjOpen && (
        <EditProjectModal project={project} isAdmin={isAdmin}
          onSave={async d => { await editProject(project.id, d); setEditProjOpen(false); toast('Project updated', 'success') }}
          onDelete={async () => { await removeProject(project.id); setEditProjOpen(false); toast('Project deleted') }}
          onClose={() => setEditProjOpen(false)}
        />
      )}
      {csvOpen && <CsvImportModal projectId={project.id} project={project} onClose={() => setCsvOpen(false)} toast={toast} />}
    </div>
  )
}

// ─── MeetingsTab (per-project) ─────────────────────────────────────────────
function MeetingsTab({ project, toast }) {
  const { members: ctxMembers, workspace, addTask, sendMeetingInvites, projects } = useData()
  const { user } = useAuth()
  const [meetings,  setMeetings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    getMeetings(project.id)
      .then(d => { setMeetings(d); setLoading(false) })
      .catch(() => setLoading(false))
  })

  function handleSaved(meeting, isNew) {
    if (isNew) setMeetings(prev => [meeting, ...prev])
    else       setMeetings(prev => prev.map(m => m.id === meeting.id ? meeting : m))
    setModalOpen(false); setEditing(null)
  }

  async function handleDelete(id) {
    try { await deleteMeeting(id); setMeetings(prev => prev.filter(m => m.id !== id)); toast?.('Meeting deleted') }
    catch(e) { toast?.(e.message, 'error') }
  }

  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLORS.surface, flexShrink: 0 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Meeting Minutes</span>
          <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 10 }}>{meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</span>
        </div>
        <Btn size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>+ New Meeting</Btn>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
        {loading ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
        ) : meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Icon name="messageCircle" size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No meetings yet</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>Record your first meeting — tasks appear in the board automatically.</div>
            <Btn onClick={() => { setEditing(null); setModalOpen(true) }}>+ New Meeting</Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 860 }}>
            {meetings.map(m => (
              <MeetingCard key={m.id} meeting={m} fmt={fmt}
                onEdit={() => { setEditing(m); setModalOpen(true) }}
                onDelete={() => handleDelete(m.id)} />
            ))}
          </div>
        )}
      </div>
      {modalOpen && (
        <MeetingModal project={project} projects={projects} workspace={workspace} user={user} members={ctxMembers || []} meeting={editing}
          onSaved={handleSaved} addTask={addTask} sendMeetingInvites={sendMeetingInvites}
          onClose={() => { setModalOpen(false); setEditing(null) }} toast={toast} />
      )}
    </div>
  )
}

// ─── NewProjectModal ──────────────────────────────────────────────────────────
export function NewProjectModal({ onClose, toast }) {
  const { addProject } = useData()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
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
      <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, paddingBottom: 2 }}>New Project</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lStyle}>Project Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} style={{ ...iStyle, background: COLORS.inputBg }} /></div>
        <div><label style={lStyle}>Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this project about?" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5, background: COLORS.inputBg }} /></div>
        <div>
          <label style={lStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>{PROJECT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'all 0.15s' }} />)}</div>
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

// ─── EditProjectModal ─────────────────────────────────────────────────────────
function EditProjectModal({ project, isAdmin, onSave, onDelete, onClose }) {
  const [name, setName] = useState(project.name)
  const [desc, setDesc] = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, paddingBottom: 2 }}>Edit Project</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lStyle}>Name</label><input value={name} onChange={e => setName(e.target.value)} style={{ ...iStyle, background: COLORS.inputBg }} /></div>
        <div><label style={lStyle}>Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5, background: COLORS.inputBg }} /></div>
        <div>
          <label style={lStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>{PROJECT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2 }} />)}</div>
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

// ─── CsvImportModal ───────────────────────────────────────────────────────────
function CsvImportModal({ projectId, project, onClose, toast }) {
  const { importTasks } = useData()
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef()

  function parseCsvLine(line) {
    const vals = []; let cur = ''; let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ } else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = '' } else { cur += ch }
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
        status: ['new','inprogress','review','done'].includes(r.status?.toLowerCase()) ? r.status.toLowerCase() : 'new',
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
    <Modal onClose={onClose} width={520}>
      <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>CSV Import</h2>
      <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 16 }}>Import tasks into <strong style={{ color: COLORS.text }}>{project?.name}</strong></p>
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: COLORS.textMuted }}>
        Columns: <code style={{ color: COLORS.accent }}>title, status, priority, assignee_name, assignee_email, due_date</code>
      </div>
      <div onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.accent }}
        onDragLeave={e => { e.currentTarget.style.borderColor = COLORS.border }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.border; const file = e.dataTransfer.files[0]; if (file) { const r = new FileReader(); r.onload = ev => setPreview(parseCsv(ev.target.result)); r.readAsText(file) } }}
        style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, transition: 'border-color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
        <Icon name="folder" size={24} color={COLORS.textMuted} style={{ marginBottom: 6 }} />
        <div style={{ fontWeight: 600, fontSize: 13 }}>Click or drag & drop a CSV</div>
        <input ref={fileRef} type="file" accept=".csv" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setPreview(parseCsv(ev.target.result)); r.readAsText(f) }}} style={{ display: 'none' }} />
      </div>
      {preview && <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, marginBottom: 12 }}>{preview.length} rows ready to import</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleImport} disabled={!preview?.length || importing}>{importing ? 'Importing…' : `Import ${preview?.length || 0} Tasks`}</Btn>
      </div>
    </Modal>
  )
}

// ─── PipelineView ─────────────────────────────────────────────────────────────
export function PipelineView({ onConvertToProject, toast }) {
  const { projects, editProject, removeProject } = useData()
  const pipeline = projects.filter(p => p.is_pipeline)
  const [newOpen, setNewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(null)
  const [converting, setConverting] = useState(null)

  async function handleConvert(p) {
    setConverting(p.id)
    try { await editProject(p.id, { is_pipeline: false }); toast?.(`"${p.name}" moved to Projects`, 'success'); onConvertToProject?.() }
    catch(e) { toast?.(e.message, 'error') } finally { setConverting(null) }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 4 }}>Pipeline</h1>
            <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Ideas and projects you want to keep in mind but haven't started yet.</p>
          </div>
          <Btn onClick={() => setNewOpen(true)}>+ Add to Pipeline</Btn>
        </div>
        {pipeline.length === 0 ? (
          <div style={{ background: COLORS.surface, border: `2px dashed ${COLORS.border}`, borderRadius: 16, padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Your pipeline is empty</div>
            <Btn onClick={() => setNewOpen(true)}>+ Add to Pipeline</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {pipeline.map(p => (
              <PipelineCard key={p.id} project={p} converting={converting === p.id}
                onEdit={() => setEditOpen(p)}
                onConvert={() => handleConvert(p)}
                onDelete={async () => { await removeProject(p.id); toast?.('Removed from pipeline') }} />
            ))}
          </div>
        )}
      </div>
      {newOpen  && <NewPipelineModal onClose={() => setNewOpen(false)} toast={toast} />}
      {editOpen && (
        <EditProjectModal project={editOpen} isAdmin={true}
          onSave={async d => { await editProject(editOpen.id, d); setEditOpen(null); toast?.('Updated', 'success') }}
          onDelete={async () => { await removeProject(editOpen.id); setEditOpen(null); toast?.('Removed') }}
          onClose={() => setEditOpen(null)} />
      )}
    </div>
  )
}

function PipelineCard({ project: p, converting, onEdit, onConvert, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', borderLeft: `4px solid ${p.color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: '3px 5px', display: 'flex', alignItems: 'center' }}><Icon name="edit" size={13} color={COLORS.textMuted} /></button>
          {!confirmDel
            ? <button onClick={() => setConfirmDel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: '3px 5px', display: 'flex', alignItems: 'center' }}><Icon name="x" size={13} color={COLORS.textMuted} /></button>
            : <button onClick={onDelete} style={{ background: COLORS.red + '18', border: `1px solid ${COLORS.red}44`, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: COLORS.red, fontFamily: 'inherit' }}>Remove?</button>
          }
        </div>
      </div>
      {p.description && <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 14, flex: 1 }}>{p.description}</p>}
      <button onClick={onConvert} disabled={converting}
        style={{ width: '100%', padding: '9px 0', background: converting ? COLORS.border : COLORS.accent + '18', border: `1.5px solid ${converting ? COLORS.border : COLORS.accent + '55'}`, borderRadius: 9, color: converting ? COLORS.textMuted : COLORS.accent, fontWeight: 700, fontSize: 12, cursor: converting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s', marginTop: 'auto' }}
        onMouseEnter={e => { if (!converting) { e.currentTarget.style.background = COLORS.accent; e.currentTarget.style.color = '#fff' } }}
        onMouseLeave={e => { if (!converting) { e.currentTarget.style.background = COLORS.accent + '18'; e.currentTarget.style.color = COLORS.accent } }}>
        <Icon name="arrowRight" size={13} color="currentColor" />
        {converting ? 'Converting…' : 'Convert to Project'}
      </button>
    </div>
  )
}

export function NewPipelineModal({ onClose, toast }) {
  const { addProject } = useData()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[4])
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try { await addProject({ name: name.trim(), description: desc, color, is_pipeline: true }); toast?.('Added to pipeline', 'success'); onClose() }
    catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Add to Pipeline</h2>
      <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>Save a project idea. No tasks, no deadlines — just a placeholder until you're ready.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lStyle}>Project Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile App Redesign" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} style={{ ...iStyle, background: COLORS.inputBg }} /></div>
        <div><label style={lStyle}>Description / Notes</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's the idea?" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.5, background: COLORS.inputBg }} /></div>
        <div>
          <label style={lStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>{PROJECT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'all 0.15s' }} />)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn onClick={handleCreate} disabled={saving || !name.trim()}>{saving ? 'Adding…' : 'Add to Pipeline'}</Btn>
      </div>
    </Modal>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function NotifModal({ onClose }) { onClose(); return null }
function hour() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' }
function hourIcon() { const h = new Date().getHours(); return h < 12 ? 'sunrise' : h < 17 ? 'sun' : 'moon' }
