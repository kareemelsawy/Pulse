import { useState, useEffect } from 'react'
import { COLORS, STATUS } from '../lib/constants'
import { Badge, Modal, Btn, Icon, lStyle, iStyle } from './UI'
import { getTasksByMeeting } from '../lib/db/tasks'
import { createMeeting, updateMeeting } from '../lib/db/meetings'

export default function MeetingModal({ project, workspace, user, members, meeting, addTask, onSaved, onClose, toast }) {
  const isEdit = !!meeting
  const [title,      setTitle]      = useState(meeting?.title || '')
  const [date,       setDate]       = useState(meeting?.meeting_date?.slice(0,10) || new Date().toISOString().slice(0,10))
  const [attendees,  setAttendees]  = useState(meeting?.attendees || '')
  const [summary,    setSummary]    = useState(meeting?.summary || '')
  const [taskRows,   setTaskRows]   = useState([emptyTask()])
  const [existTasks, setExistTasks] = useState([])
  const [loadingT,   setLoadingT]   = useState(isEdit)
  const [saving,     setSaving]     = useState(false)

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
    if (!title.trim()) return
    setSaving(true)
    try {
      const validTaskRows = taskRows.filter(r => r.title.trim())
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
        saved = await createMeeting(project.id, workspace.id, user.id, fields)
      }

      for (const r of validTaskRows) {
        const member = members.find(m => m.user_id === r.assigneeId)
        const assignee_name  = r.useFreeform ? r.assigneeFreeform.trim() : (member?.full_name || member?.email || '')
        const assignee_email = r.useFreeform ? '' : (member?.email || '')
        await addTask(project.id, { title: r.title.trim(), status: 'new', priority: r.priority, assignee_name, assignee_email, due_date: r.due_date || null, meeting_id: saved.id })
      }

      toast?.('Meeting saved' + (validTaskRows.length ? ` · ${validTaskRows.length} task${validTaskRows.length > 1 ? 's' : ''} created` : ''), 'success')
      onSaved(saved, !isEdit)
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  const newTaskCount = taskRows.filter(r => r.title.trim()).length

  return (
    <Modal onClose={onClose} width={660}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>{isEdit ? 'Edit Meeting' : 'New Meeting'}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: 4 }}><Icon name="x" size={18} color={COLORS.textMuted} /></button>
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

      {/* Tasks */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <label style={{ ...lStyle, marginBottom: 0 }}>Tasks</label>
            <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 8 }}>Will be created in the project board as New</span>
          </div>
          <button onClick={() => setTaskRows(prev => [...prev, emptyTask()])} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Task</button>
        </div>

        {isEdit && (loadingT ? (
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>Loading existing tasks…</div>
        ) : existTasks.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Existing tasks from this meeting</div>
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
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Add more tasks below — existing ones aren't modified here.</div>
          </div>
        ) : null)}

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
          {newTaskCount > 0 ? `${newTaskCount} task${newTaskCount > 1 ? 's' : ''} will be created in the board` : 'No tasks to create yet'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || !title.trim()}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Meeting'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
