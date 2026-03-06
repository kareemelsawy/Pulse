import { useState, useEffect, useRef } from 'react'
import { COLORS, STATUS } from '../lib/constants'
import { Badge, Modal, Btn, Icon, lStyle, iStyle } from './UI'
import { getTasksByMeeting } from '../lib/db/tasks'
import { createMeeting, updateMeeting } from '../lib/db/meetings'

// ─── AttendeePicker ───────────────────────────────────────────────────────────
// Lets you pick workspace members OR type any @homzmart.com email
function AttendeePicker({ members, value, onChange }) {
  const [input,    setInput]    = useState('')
  const [focused,  setFocused]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef(null)

  // value is an array of { email, name, isMember }
  const suggestions = input.length > 0
    ? members.filter(m =>
        !value.find(a => a.email === m.email) &&
        ((m.full_name || '').toLowerCase().includes(input.toLowerCase()) ||
         (m.email || '').toLowerCase().includes(input.toLowerCase()))
      )
    : members.filter(m => !value.find(a => a.email === m.email))

  function addMember(m) {
    onChange([...value, { email: m.email, name: m.full_name || m.email, isMember: true }])
    setInput('')
    setError('')
    inputRef.current?.focus()
  }

  function addEmail(email) {
    const e = email.trim().toLowerCase()
    if (!e) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError('Enter a valid email address'); return }
    if (!e.endsWith('@homzmart.com')) { setError('Only @homzmart.com emails can be invited as guests'); return }
    if (value.find(a => a.email === e)) { setError('Already added'); return }
    onChange([...value, { email: e, name: e, isMember: false }])
    setInput('')
    setError('')
    inputRef.current?.focus()
  }

  function remove(email) {
    onChange(value.filter(a => a.email !== email))
  }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      // If input matches a member suggestion exactly, pick them
      const exact = members.find(m => m.email?.toLowerCase() === input.trim().toLowerCase())
      if (exact) addMember(exact)
      else addEmail(input.trim())
    }
    if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1].email)
    }
  }

  return (
    <div>
      {/* Pills + input */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px', background: COLORS.inputBg, border: `1px solid ${focused ? COLORS.accent : COLORS.border}`, borderRadius: 8, cursor: 'text', minHeight: 42, transition: 'border-color 0.15s' }}>
        {value.map(a => (
          <span key={a.email} style={{ display: 'flex', alignItems: 'center', gap: 5, background: a.isMember ? COLORS.accent + '22' : COLORS.surface, border: `1px solid ${a.isMember ? COLORS.accent + '55' : COLORS.border}`, borderRadius: 20, padding: '2px 10px 2px 8px', fontSize: 12, color: a.isMember ? COLORS.accent : COLORS.textDim }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.isMember ? COLORS.accent : COLORS.textMuted, flexShrink: 0 }} />
            {a.name !== a.email ? `${a.name}` : a.email}
            {!a.isMember && <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 2 }}>guest</span>}
            <button onClick={e => { e.stopPropagation(); remove(a.email) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: 0, display: 'flex', lineHeight: 1, marginLeft: 2 }}>×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (input.trim()) addEmail(input) }}
          placeholder={value.length === 0 ? 'Type a name or @homzmart.com email…' : ''}
          style={{ border: 'none', outline: 'none', background: 'none', color: COLORS.text, fontSize: 13, minWidth: 160, flex: 1 }}
        />
      </div>

      {error && <div style={{ fontSize: 11, color: COLORS.red, marginTop: 4 }}>{error}</div>}

      {/* Dropdown suggestions */}
      {focused && suggestions.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: `0 4px 12px ${COLORS.shadow}` }}>
          {suggestions.slice(0, 6).map(m => (
            <div key={m.user_id} onMouseDown={e => { e.preventDefault(); addMember(m) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', borderBottom: `1px solid ${COLORS.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS.accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                {(m.full_name || m.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{m.full_name || m.email}</div>
                {m.full_name && <div style={{ fontSize: 11, color: COLORS.textMuted }}>{m.email}</div>}
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.accent, background: COLORS.accent + '15', borderRadius: 4, padding: '1px 6px' }}>member</span>
            </div>
          ))}
          {input && !members.find(m => m.email?.toLowerCase() === input.toLowerCase()) && input.includes('@') && (
            <div onMouseDown={e => { e.preventDefault(); addEmail(input) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', color: COLORS.textMuted, fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <Icon name="plus" size={14} color={COLORS.textMuted} />
              Invite <strong style={{ color: COLORS.text, marginLeft: 4 }}>{input}</strong> as guest
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 5 }}>
        Workspace members get notified · @homzmart.com emails receive a guest invite
      </div>
    </div>
  )
}

// ─── MeetingModal ─────────────────────────────────────────────────────────────
export default function MeetingModal({ project, workspace, user, members, meeting, addTask, onSaved, onClose, toast, sendMeetingInvites, projects }) {
  const isEdit = !!meeting

  // All non-pipeline projects available for task assignment
  const allProjects = projects ? projects.filter(p => !p.is_pipeline) : (project ? [project] : [])

  function parseExistingAttendees(attendeesStr) {
    if (!attendeesStr) return []
    return attendeesStr.split(',').map(s => s.trim()).filter(Boolean).map(email => {
      const member = members.find(m => m.email === email)
      return { email, name: member?.full_name || email, isMember: !!member }
    })
  }

  const defaultProjectId = project?.id || allProjects[0]?.id || ''

  const [title,      setTitle]      = useState(meeting?.title || '')
  const [date,       setDate]       = useState(meeting?.meeting_date?.slice(0,10) || new Date().toISOString().slice(0,10))
  const [attendees,  setAttendees]  = useState(() => parseExistingAttendees(meeting?.attendees))
  const [summary,    setSummary]    = useState(meeting?.summary || '')
  const [taskRows,   setTaskRows]   = useState([emptyTask(defaultProjectId)])
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

  function emptyTask(projectId) {
    return { title: '', assigneeId: '', assigneeEmail: '', due_date: '', priority: 'medium', projectId: projectId || defaultProjectId }
  }

  function setRow(i, field, val) {
    setTaskRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  async function handleSave() {
    if (!title.trim()) return
    if (allProjects.length === 0) { toast?.('No projects available', 'error'); return }
    setSaving(true)
    try {
      const validTaskRows = taskRows.filter(r => r.title.trim())
      const attendeeEmails = attendees.map(a => a.email).join(', ')

      // Meeting lives in the first/default project (DB constraint), but tasks go to their own project
      const meetingProjectId = meeting?.project_id || defaultProjectId
      const meetingProject   = allProjects.find(p => p.id === meetingProjectId) || allProjects[0]

      const fields = {
        title: title.trim(),
        meeting_date: date,
        attendees: attendeeEmails,
        summary: summary.trim(),
        task_count: (isEdit ? existTasks.length : 0) + validTaskRows.length,
      }

      let saved
      if (isEdit) {
        await updateMeeting(meeting.id, fields)
        saved = { ...meeting, ...fields }
      } else {
        saved = await createMeeting(meetingProject.id, workspace.id, user.id, fields)
      }

      // Create tasks — each in its chosen project
      for (const r of validTaskRows) {
        const member = members.find(m => m.user_id === r.assigneeId)
        const assignee_name  = member?.full_name || member?.email || r.assigneeEmail || ''
        const assignee_email = member?.email || r.assigneeEmail || ''
        const taskProjectId  = r.projectId || meetingProject.id
        await addTask(taskProjectId, {
          title: r.title.trim(),
          status: 'new',
          priority: r.priority,
          assignee_name,
          assignee_email,
          due_date: r.due_date || null,
          meeting_id: saved.id,
        })
      }

      // Send meeting minutes — await and surface errors
      const emailsToInvite = attendees.map(a => a.email).filter(Boolean)
      if (emailsToInvite.length && sendMeetingInvites) {
        const actionItems = validTaskRows.map(r => {
          const member = members.find(m => m.user_id === r.assigneeId)
          const taskProject = allProjects.find(p => p.id === r.projectId)
          return {
            title: r.title.trim(),
            assignee: member?.full_name || member?.email || r.assigneeEmail || '',
            due_date: r.due_date || '',
            priority: r.priority,
            projectName: taskProject?.name || meetingProject?.name || '',
          }
        })
        try {
          await sendMeetingInvites({ meeting: saved, projectName: meetingProject?.name || '', attendeeEmails: emailsToInvite, actionItems })
          toast?.(`Minutes sent to ${emailsToInvite.length} attendee${emailsToInvite.length > 1 ? 's' : ''}`, 'success')
        } catch(emailErr) {
          console.error('Meeting email failed:', emailErr)
          toast?.(`Meeting saved but email failed: ${emailErr.message}`, 'error')
        }
      } else {
        const taskMsg = validTaskRows.length ? ` · ${validTaskRows.length} task${validTaskRows.length > 1 ? 's' : ''} created` : ''
        toast?.(`Meeting saved${taskMsg}`, 'success')
      }

      onSaved(saved, !isEdit, meetingProject)
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  const newTaskCount = taskRows.filter(r => r.title.trim()).length

  return (
    <Modal onClose={onClose} width={700}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>{isEdit ? 'Edit Meeting' : 'New Meeting'}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: 4 }}>
          <Icon name="x" size={18} color={COLORS.textMuted} />
        </button>
      </div>

      {/* Title + Date */}
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

      {/* Attendees */}
      <div style={{ marginBottom: 14 }}>
        <label style={lStyle}>Attendees</label>
        <AttendeePicker members={members} value={attendees} onChange={setAttendees} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={lStyle}>Meeting Notes / Minutes</label>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Key decisions, discussion points, context…" rows={3} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6, background: COLORS.inputBg }} />
      </div>

      {/* Tasks */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <label style={{ ...lStyle, marginBottom: 0 }}>Action Items</label>
            {allProjects.length > 1 && <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 8 }}>Each item can go to any project</span>}
          </div>
          <button onClick={() => setTaskRows(prev => [...prev, emptyTask(defaultProjectId)])}
            style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Item
          </button>
        </div>

        {/* Existing tasks on edit */}
        {isEdit && (loadingT ? (
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>Loading existing tasks…</div>
        ) : existTasks.length > 0 ? (
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
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Add more items below — existing ones aren't modified here.</div>
          </div>
        ) : null)}

        {/* New task rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {taskRows.map((r, i) => (
            <div key={i} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 76px 26px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={r.title} onChange={e => setRow(i, 'title', e.target.value)} placeholder="Task title…" style={{ ...iStyle, background: COLORS.surface, fontSize: 12 }} />
                <input type="date" value={r.due_date || ''} onChange={e => setRow(i, 'due_date', e.target.value)} style={{ ...iStyle, background: COLORS.surface, fontSize: 11 }} />
                <select value={r.priority} onChange={e => setRow(i, 'priority', e.target.value)}
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: '6px 6px', fontSize: 11, outline: 'none', width: '100%' }}>
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={() => setTaskRows(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={13} color={COLORS.textMuted} />
                </button>
              </div>

              {/* Assignee + Project row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>Assign:</span>
                <select value={r.assigneeId} onChange={e => setRow(i, 'assigneeId', e.target.value)}
                  style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none' }}>
                  <option value="">— Unassigned —</option>
                  {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
                  <option value="__email__">By email (guest)…</option>
                </select>
                {r.assigneeId === '__email__' && (
                  <input
                    value={r.assigneeEmail || ''}
                    onChange={e => setRow(i, 'assigneeEmail', e.target.value)}
                    placeholder="guest@homzmart.com"
                    style={{ flex: 1, ...iStyle, background: COLORS.surface, fontSize: 12 }}
                  />
                )}
                {allProjects.length > 1 && (
                  <>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>→</span>
                    <select value={r.projectId || defaultProjectId} onChange={e => setRow(i, 'projectId', e.target.value)}
                      style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.accent, borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', fontWeight: 600 }}>
                      {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>
          {newTaskCount > 0 && <span>{newTaskCount} action item{newTaskCount > 1 ? 's' : ''} will be created · </span>}
          {attendees.length > 0
            ? <span style={{ color: COLORS.green }}>✓ Minutes will be emailed to {attendees.length} attendee{attendees.length > 1 ? 's' : ''}</span>
            : <span style={{ color: COLORS.amber }}>⚠ Add attendees to send minutes by email</span>
          }
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Sending…' : isEdit ? 'Save & Resend Minutes' : 'Save & Send Minutes'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
