import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS } from '../lib/constants'
import { Avatar, Badge, Modal, Btn, Icon, lStyle, iStyle } from '../components/UI'
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../lib/db/meetings'
import { getTasksByMeeting } from '../lib/db/tasks'
import { STATUS, PRIORITY } from '../lib/constants'

// ─── Global Meetings Page ─────────────────────────────────────────────────────
export default function GlobalMeetingsPage({ toast }) {
  const { projects, members: ctxMembers, workspace, addTask } = useData()
  const { user } = useAuth()
  const activeProjects = projects.filter(p => !p.is_pipeline)

  const [allMeetings,  setAllMeetings]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [filterProj,   setFilterProj]   = useState('all')
  const [searchQ,      setSearchQ]      = useState('')

  // Load meetings from all projects
  useEffect(() => {
    if (!activeProjects.length) { setLoading(false); return }
    Promise.all(activeProjects.map(p => getMeetings(p.id).then(ms => ms.map(m => ({ ...m, _project: p }))).catch(() => [])))
      .then(results => {
        const flat = results.flat().sort((a, b) => {
          const da = a.meeting_date || a.created_at
          const db = b.meeting_date || b.created_at
          return db.localeCompare(da)
        })
        setAllMeetings(flat)
        setLoading(false)
      })
  }, [projects.length])

  function handleSaved(meeting, isNew, projectObj) {
    const enriched = { ...meeting, _project: projectObj }
    if (isNew) setAllMeetings(prev => [enriched, ...prev].sort((a, b) => (b.meeting_date||b.created_at).localeCompare(a.meeting_date||a.created_at)))
    else       setAllMeetings(prev => prev.map(m => m.id === meeting.id ? enriched : m))
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete(id) {
    try {
      await deleteMeeting(id)
      setAllMeetings(prev => prev.filter(m => m.id !== id))
      toast?.('Meeting deleted')
    } catch(e) { toast?.(e.message, 'error') }
  }

  const filtered = allMeetings.filter(m => {
    if (filterProj !== 'all' && m.project_id !== filterProj) return false
    if (searchQ && !m.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  // Group by month
  const groups = {}
  filtered.forEach(m => {
    const key = m.meeting_date
      ? new Date(m.meeting_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Undated'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0 22px', height: 54, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 12, background: COLORS.surface, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.purple + '22', border: `1px solid ${COLORS.purple}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="messageCircle" size={16} color={COLORS.purple} />
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>All Meetings</h1>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Across all projects</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '5px 10px', width: 180 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>⌕</span>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search meetings…" style={{ background: 'none', border: 'none', color: COLORS.text, fontSize: 13, width: '100%', outline: 'none' }} />
        </div>
        <Btn size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>+ New Meeting</Btn>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', background: COLORS.surface, flexShrink: 0, overflowX: 'auto' }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted, flexShrink: 0 }}>Project:</span>
        {[{ id: 'all', name: 'All Projects', color: COLORS.textMuted }, ...activeProjects].map(p => (
          <button key={p.id} onClick={() => setFilterProj(p.id)}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filterProj === p.id ? (p.color || COLORS.accent) : COLORS.border}`, background: filterProj === p.id ? (p.color || COLORS.accent) + '18' : 'none', color: filterProj === p.id ? (p.color || COLORS.accent) : COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {p.id !== 'all' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />}
            {p.name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted, flexShrink: 0 }}>{filtered.length} meeting{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
        {loading ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Loading meetings…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: COLORS.purple + '18', border: `1px solid ${COLORS.purple}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="messageCircle" size={28} color={COLORS.purple} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No meetings yet</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              Meetings created inside projects show up here. You can also create cross-project meetings directly from this hub.
            </div>
            <Btn onClick={() => { setEditing(null); setModalOpen(true) }}>+ New Meeting</Btn>
          </div>
        ) : (
          <div style={{ maxWidth: 900 }}>
            {Object.entries(groups).map(([month, mts]) => (
              <div key={month} style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {month}
                  <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>{mts.length} meeting{mts.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mts.map(m => (
                    <GlobalMeetingCard
                      key={m.id}
                      meeting={m}
                      fmt={fmt}
                      onEdit={() => { setEditing(m); setModalOpen(true) }}
                      onDelete={() => handleDelete(m.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <GlobalMeetingModal
          projects={activeProjects}
          workspace={workspace}
          user={user}
          members={ctxMembers || []}
          meeting={editing}
          onSaved={handleSaved}
          addTask={addTask}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          toast={toast}
        />
      )}
    </div>
  )
}

// ─── Global Meeting Card ───────────────────────────────────────────────────────
function GlobalMeetingCard({ meeting: m, fmt, onEdit, onDelete }) {
  const [expanded,   setExpanded]   = useState(false)
  const [tasks,      setTasks]      = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const proj = m._project

  async function toggleExpand() {
    if (!expanded && tasks === null) {
      const data = await getTasksByMeeting(m.id).catch(() => [])
      setTasks(data)
    }
    setExpanded(e => !e)
  }

  const taskCount = m.task_count ?? 0
  const doneCount = (tasks || []).filter(t => t.status === 'done').length

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${proj?.color || COLORS.purple}` }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: (proj?.color || COLORS.purple) + '18', border: `1px solid ${(proj?.color || COLORS.purple)}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="messageCircle" size={16} color={proj?.color || COLORS.purple} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</span>
            {m.meeting_date && (
              <span style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '2px 8px' }}>{fmt(m.meeting_date)}</span>
            )}
            {/* Project badge */}
            {proj && (
              <span style={{ fontSize: 11, fontWeight: 700, color: proj.color, background: proj.color + '15', border: `1px solid ${proj.color}30`, borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: proj.color }} />
                {proj.name}
              </span>
            )}
          </div>
          {m.attendees && <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>👥 {m.attendees}</div>}
          {m.summary && (
            <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical' }}>{m.summary}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {taskCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '2px 8px' }}>
              {tasks ? `${doneCount}/${tasks.length}` : taskCount} tasks
            </span>
          )}
          <button onClick={toggleExpand} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: COLORS.textMuted, fontFamily: 'inherit' }}>
            {expanded ? '▲ Hide' : '▼ Tasks'}
          </button>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
            <Icon name="edit" size={14} color={COLORS.textMuted} />
          </button>
          {!confirmDel
            ? <button onClick={() => setConfirmDel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: '4px 6px', display: 'flex', alignItems: 'center' }}><Icon name="x" size={14} color={COLORS.textMuted} /></button>
            : <button onClick={onDelete} style={{ background: COLORS.red + '18', border: `1px solid ${COLORS.red}44`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: COLORS.red, fontFamily: 'inherit' }}>Delete?</button>
          }
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          {tasks === null ? (
            <div style={{ padding: '12px 20px', fontSize: 12, color: COLORS.textMuted }}>Loading…</div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: '12px 20px', fontSize: 12, color: COLORS.textMuted }}>No tasks were created from this meeting.</div>
          ) : (
            <div style={{ padding: '12px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tasks from this meeting</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[t.status]?.color || COLORS.border, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: t.status === 'done' ? COLORS.textMuted : COLORS.text, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                    {t.assignee_name && <span style={{ fontSize: 11, color: COLORS.textMuted }}>{t.assignee_name}</span>}
                    {t.due_date && <span style={{ fontSize: 11, color: COLORS.textMuted }}>{t.due_date}</span>}
                    <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: PRIORITY[t.priority]?.color + '22', color: PRIORITY[t.priority]?.color }}>{PRIORITY[t.priority]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Global Meeting Modal ──────────────────────────────────────────────────────
function GlobalMeetingModal({ projects, workspace, user, members, meeting, addTask, onSaved, onClose, toast }) {
  const isEdit = !!meeting
  const [title,       setTitle]       = useState(meeting?.title || '')
  const [projectId,   setProjectId]   = useState(meeting?.project_id || (projects[0]?.id || ''))
  const [date,        setDate]        = useState(meeting?.meeting_date?.slice(0,10) || new Date().toISOString().slice(0,10))
  const [attendees,   setAttendees]   = useState(meeting?.attendees || '')
  const [summary,     setSummary]     = useState(meeting?.summary || '')
  const [taskRows,    setTaskRows]    = useState([emptyTask()])
  const [existTasks,  setExistTasks]  = useState([])
  const [loadingT,    setLoadingT]    = useState(isEdit)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (isEdit) {
      getTasksByMeeting(meeting.id)
        .then(data => { setExistTasks(data); setLoadingT(false) })
        .catch(() => setLoadingT(false))
    }
  }, [])

  function emptyTask() {
    return { title: '', assigneeId: '', assigneeFreeform: '', useFreeform: false, due_date: '', priority: 'medium' }
  }

  function setRow(i, field, val) {
    setTaskRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  async function handleSave() {
    if (!title.trim() || !projectId) return
    setSaving(true)
    try {
      const validTaskRows = taskRows.filter(r => r.title.trim())
      const selectedProject = projects.find(p => p.id === projectId)
      const fields = {
        title: title.trim(),
        meeting_date: date,
        attendees: attendees.trim(),
        summary: summary.trim(),
        task_count: (isEdit ? existTasks.length : 0) + validTaskRows.length,
      }

      let saved
      if (isEdit) {
        await updateMeeting(meeting.id, fields)
        saved = { ...meeting, ...fields }
      } else {
        saved = await createMeeting(projectId, workspace.id, user.id, fields)
      }

      for (const r of validTaskRows) {
        const member = members.find(m => m.user_id === r.assigneeId)
        const assignee_name  = r.useFreeform ? r.assigneeFreeform.trim() : (member?.full_name || member?.email || '')
        const assignee_email = r.useFreeform ? '' : (member?.email || '')
        await addTask(projectId, {
          title: r.title.trim(),
          status: 'new',
          priority: r.priority,
          assignee_name,
          assignee_email,
          due_date: r.due_date || null,
          meeting_id: saved.id,
        })
      }

      toast?.('Meeting saved' + (validTaskRows.length ? ` · ${validTaskRows.length} task${validTaskRows.length > 1 ? 's' : ''} created` : ''), 'success')
      onSaved(saved, !isEdit, selectedProject)
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  const newTaskCount = taskRows.filter(r => r.title.trim()).length

  return (
    <Modal onClose={onClose} width={680}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>{isEdit ? 'Edit Meeting' : 'New Meeting'}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: 4 }}><Icon name="x" size={18} color={COLORS.textMuted} /></button>
      </div>

      {/* Project picker — prominently shown (key difference from per-project modal) */}
      <div style={{ marginBottom: 14 }}>
        <label style={lStyle}>Project *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {projects.map(p => {
            const active = projectId === p.id
            return (
              <button key={p.id} onClick={() => !isEdit && setProjectId(p.id)}
                disabled={isEdit}
                style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${active ? p.color : COLORS.border}`, background: active ? p.color + '18' : COLORS.inputBg, color: active ? p.color : COLORS.textDim, cursor: isEdit ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: active ? 700 : 400, fontSize: 12, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, opacity: isEdit && !active ? 0.4 : 1 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
                {p.name}
              </button>
            )
          })}
        </div>
        {isEdit && <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Project cannot be changed after creation.</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={lStyle}>Meeting Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint Planning Q1" autoFocus style={{ ...iStyle, background: COLORS.inputBg }} />
        </div>
        <div>
          <label style={lStyle}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...iStyle, background: COLORS.inputBg }} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lStyle}>Attendees</label>
        <input value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="e.g. Kareem, Sara, Ahmed" style={{ ...iStyle, background: COLORS.inputBg }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={lStyle}>Meeting Notes / Minutes</label>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Key decisions, discussion points, context…" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6, background: COLORS.inputBg }} />
      </div>

      {/* Tasks section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <label style={{ ...lStyle, marginBottom: 0 }}>Tasks</label>
            <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 8 }}>Will appear in the selected project's board</span>
          </div>
          <button onClick={() => setTaskRows(prev => [...prev, emptyTask()])} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Task</button>
        </div>

        {isEdit && existTasks.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Existing tasks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {existTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: COLORS.bg, borderRadius: 7, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS[t.status]?.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: COLORS.textDim }}>{t.title}</span>
                  {t.assignee_name && <span style={{ fontSize: 11, color: COLORS.textMuted }}>{t.assignee_name}</span>}
                  <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {taskRows.map((r, i) => (
            <div key={i} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 76px 26px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={r.title} onChange={e => setRow(i, 'title', e.target.value)} placeholder="Task title…" style={{ ...iStyle, background: COLORS.surface, fontSize: 12 }} />
                <input type="date" value={r.due_date || ''} onChange={e => setRow(i, 'due_date', e.target.value)} style={{ ...iStyle, background: COLORS.surface, fontSize: 11 }} />
                <select value={r.priority} onChange={e => setRow(i, 'priority', e.target.value)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: '6px 6px', fontSize: 11, outline: 'none', width: '100%' }}>
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={() => setTaskRows(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={13} color={COLORS.textMuted} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>Assign to:</span>
                {!r.useFreeform ? (
                  <>
                    <select value={r.assigneeId} onChange={e => setRow(i, 'assigneeId', e.target.value)} style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none' }}>
                      <option value="">— Unassigned —</option>
                      {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
                    </select>
                    <button onClick={() => setRow(i, 'useFreeform', true)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, color: COLORS.textMuted, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>External?</button>
                  </>
                ) : (
                  <>
                    <input value={r.assigneeFreeform} onChange={e => setRow(i, 'assigneeFreeform', e.target.value)} placeholder="Name (external / guest)" style={{ flex: 1, ...iStyle, background: COLORS.surface, fontSize: 12 }} />
                    <button onClick={() => { setRow(i, 'useFreeform', false); setRow(i, 'assigneeFreeform', '') }} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, color: COLORS.accent, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Member?</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>
          {newTaskCount > 0 ? `${newTaskCount} task${newTaskCount > 1 ? 's' : ''} will be created` : 'No tasks yet'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || !title.trim() || !projectId}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Meeting'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
