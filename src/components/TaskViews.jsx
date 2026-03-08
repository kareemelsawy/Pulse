import { useData } from '../contexts/DataContext'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Avatar, Badge, Icon } from './UI'

export function BoardView({ tasks, onTaskClick }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {Object.entries(STATUS).map(([sk, sm]) => {
        const col = tasks.filter(t => t.status === sk)
        return (
          <div key={sk} style={{ flex: '0 0 264px', background: COLORS.surface, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 15px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sm.color }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>{sm.label}</span>
              <span style={{ marginLeft: 'auto', background: COLORS.border, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>{col.length}</span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
              {col.map(t => (
                <div key={t.id} onClick={() => onTaskClick(t)}
                  style={{ background: COLORS.surface, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,100,255,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.boxShadow = '' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.4 }}>{t.title}</span>
                    <PriorityIcon priority={t.priority} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t.assignee_name ? <Avatar name={t.assignee_name} size={20} /> : <span />}
                    {t.due_date && <span style={{ fontSize: 10, color: COLORS.textMuted }}>{t.due_date}</span>}
                  </div>
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

export function ListView({ tasks, onTaskClick }) {
  return (
    <div style={{ background: COLORS.surface, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 90px 90px', padding: '9px 15px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', background: COLORS.surface }}>
        <span>Task</span><span>Status</span><span>Assignee</span><span>Priority</span><span>Due</span>
      </div>
      {tasks.map((t, i) => (
        <div key={t.id} onClick={() => onTaskClick(t)}
          style={{ display: 'grid', gridTemplateColumns: '1fr 110px 120px 90px 90px', padding: '11px 15px', borderBottom: i < tasks.length-1 ? '1px solid rgba(255,255,255,0.07)' : 'none', cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}>
          <span style={{ fontWeight: 500, paddingRight: 12 }}>{t.title}</span>
          <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.assignee_name && <><Avatar name={t.assignee_name} size={20} /><span style={{ fontSize: 12, color: COLORS.textDim }}>{t.assignee_name.split(' ')[0]}</span></>}
          </div>
          <span style={{ color: PRIORITY[t.priority]?.color, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <PriorityIcon priority={t.priority} /> {PRIORITY[t.priority]?.label}
          </span>
          <span style={{ fontSize: 12, color: t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' ? COLORS.red : COLORS.textMuted }}>{t.due_date}</span>
        </div>
      ))}
      {!tasks.length && <div style={{ padding: 36, textAlign: 'center', color: COLORS.textMuted }}>No tasks found</div>}
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
      <Icon name="arrowRight" size={11} color={COLORS.textMuted} style={{ marginRight: 4 }} />{STATUS[next].label}
    </button>
  )
}

export function PriorityIcon({ priority }) {
  const name = priority === 'high' ? 'priorityHigh' : priority === 'low' ? 'priorityLow' : 'priorityMed'
  return <Icon name={name} size={12} color={PRIORITY[priority]?.color} />
}
