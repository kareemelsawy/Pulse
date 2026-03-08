import { useState } from 'react'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Badge, Icon } from './UI'
import { getTasksByMeeting } from '../lib/db/tasks'

export default function MeetingCard({ meeting, fmt, onEdit, onDelete, accentColor, showProject }) {
  const [expanded,   setExpanded]   = useState(false)
  const [tasks,      setTasks]      = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const proj  = meeting._project
  const color = accentColor || proj?.color || COLORS.accent

  async function toggleExpand() {
    if (!expanded && tasks === null) {
      const data = await getTasksByMeeting(meeting.id).catch(() => [])
      setTasks(data)
    }
    setExpanded(e => !e)
  }

  const doneCount = (tasks || []).filter(t => t.status === 'done').length
  const taskCount = meeting.task_count ?? 0

  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${color}` }}>
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
            <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical' }}>{meeting.summary}</p>
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
