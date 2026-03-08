import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { DARK_THEME, STATUS } from '../lib/constants'
import { StatusBadge, PriorityBadge, Icon } from '../components/UI'

const C = DARK_THEME

export default function MyTasksPage({ toast }) {
  const { user } = useAuth()
  const { myTasks, projects, editTask } = useData()
  const [filter, setFilter] = useState('all')

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  const filtered = filter === 'all' ? myTasks : myTasks.filter(t => t.status === filter)

  async function advanceStatus(task) {
    const flow = { new: 'inprogress', inprogress: 'review', review: 'done' }
    const next = flow[task.status]
    if (!next) return
    try {
      await editTask(task.id, { status: next }, task)
      toast?.(`Moved to ${STATUS[next]?.label}`, 'success')
    } catch { toast?.('Failed to update task', 'error') }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>
          My Tasks
        </h1>
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>{myTasks.length} open tasks assigned to you</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'new', 'inprogress', 'review'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '5px 14px', borderRadius: 99, border: `1px solid ${filter === s ? C.accent : C.border}`,
            background: filter === s ? C.accentBg : 'transparent',
            color: filter === s ? '#7eaaff' : C.textMuted,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {s === 'all' ? 'All' : STATUS[s]?.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          padding: 48, textAlign: 'center',
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <p style={{ color: C.textMuted, fontSize: 14 }}>No tasks here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const proj = projectMap[t.project_id]
            return (
              <div key={t.id} className="task-card" style={{
                padding: '14px 18px', borderRadius: 12,
                background: C.bgCard, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {/* Advance status */}
                <button onClick={() => advanceStatus(t)} title="Advance status" style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${STATUS[t.status]?.color || C.border}`,
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.status === 'done' && <Icon name="check" size={12} color={STATUS.done.color} />}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.title}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {proj && <span style={{ fontSize: 11, color: C.textMuted }}>{proj.name}</span>}
                    {t.due_date && (
                      <span style={{ fontSize: 11, color: new Date(t.due_date) < new Date() ? '#fca5a5' : C.textMuted }}>
                        Due {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusBadge status={t.status} />
                  {t.priority && <PriorityBadge priority={t.priority} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
