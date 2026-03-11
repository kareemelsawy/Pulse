import { useState } from 'react'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Badge, Icon, Modal, Btn } from './UI'
import { getTasksByMeeting } from '../lib/db/tasks'

export default function MeetingCard({ meeting, fmt, onEdit, onDelete, accentColor, showProject }) {
  const [viewOpen,   setViewOpen]   = useState(false)
  const [tasks,      setTasks]      = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const proj  = meeting._project
  const color = accentColor || proj?.color || COLORS.accent

  async function openView() {
    if (tasks === null) {
      const data = await getTasksByMeeting(meeting.id).catch(() => [])
      setTasks(data)
    }
    setViewOpen(true)
  }

  const doneCount = (tasks || []).filter(t => t.status === 'done').length
  const taskCount = meeting.task_count ?? 0

  return (
    <>
      {/* ── Card (clickable) ─────────────────────────────────────────── */}
      <div
        onClick={openView}
        style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
      >
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="messageCircle" size={18} color={color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{meeting.title}</span>
              {meeting.meeting_date && (
                <span style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '2px 8px' }}>{fmt(meeting.meeting_date)}</span>
              )}
              {showProject && proj && (
                <span style={{ fontSize: 11, fontWeight: 700, color: proj.color, background: proj.color + '15', border: `1px solid ${proj.color}30`, borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: proj.color }} />
                  {proj.name}
                </span>
              )}
            </div>
            {meeting.attendees && <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>👥 {meeting.attendees}</div>}
            {meeting.summary && (
              <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{meeting.summary}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {taskCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '2px 8px' }}>
                {tasks ? `${doneCount}/${tasks.length}` : taskCount} tasks
              </span>
            )}
            <button onClick={e => { e.stopPropagation(); onEdit() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
              <Icon name="edit" size={14} color={COLORS.textMuted} />
            </button>
            {!confirmDel
              ? <button onClick={e => { e.stopPropagation(); setConfirmDel(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, padding: '4px 6px', display: 'flex', alignItems: 'center' }}><Icon name="x" size={14} color={COLORS.textMuted} /></button>
              : <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: COLORS.red + '18', border: `1px solid ${COLORS.red}44`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: COLORS.red, fontFamily: 'inherit' }}>Delete?</button>
            }
          </div>
        </div>
      </div>

      {/* ── View-only modal ──────────────────────────────────────────── */}
      {viewOpen && (
        <Modal onClose={() => { setViewOpen(false); setConfirmDel(false) }} width={620}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="messageCircle" size={20} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', margin: '0 0 6px' }}>{meeting.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {meeting.meeting_date && (
                    <span style={{ fontSize: 12, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '2px 8px' }}>📅 {fmt(meeting.meeting_date)}</span>
                  )}
                  {showProject && proj && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: proj.color, background: proj.color + '15', border: `1px solid ${proj.color}30`, borderRadius: 20, padding: '2px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: proj.color }} />
                      {proj.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Btn size="sm" onClick={() => { setViewOpen(false); onEdit() }}>✏ Edit</Btn>
              <button onClick={() => setViewOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: COLORS.textMuted }}>
                <Icon name="x" size={18} color={COLORS.textMuted} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Attendees */}
            {meeting.attendees && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Attendees</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {meeting.attendees.split(',').map(a => a.trim()).filter(Boolean).map(a => (
                    <span key={a} style={{ fontSize: 12, fontWeight: 600, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '3px 10px', color: COLORS.textDim }}>
                      👤 {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {meeting.summary && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Summary</div>
                <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.7, margin: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>{meeting.summary}</p>
              </div>
            )}

            {/* Tasks from this meeting */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                Action Items {tasks ? `(${tasks.length})` : ''}
              </div>
              {tasks === null ? (
                <div style={{ fontSize: 12, color: COLORS.textMuted, padding: '10px 0' }}>Loading…</div>
              ) : tasks.length === 0 ? (
                <div style={{ fontSize: 12, color: COLORS.textMuted, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px', fontStyle: 'italic' }}>No tasks were created from this meeting.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[t.status]?.color || COLORS.border, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: t.status === 'done' ? COLORS.textMuted : COLORS.text, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                      {t.assignee_name && <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>{t.assignee_name}</span>}
                      {t.due_date && <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>Due {t.due_date}</span>}
                      <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: PRIORITY[t.priority]?.color + '22', color: PRIORITY[t.priority]?.color, flexShrink: 0 }}>{PRIORITY[t.priority]?.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
