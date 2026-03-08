import { useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { DARK_THEME, STATUS, PRIORITY } from '../lib/constants'
import { ProgressBar } from '../components/UI'

const C = DARK_THEME

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      padding: '20px 22px', borderRadius: 14,
      background: C.bgCard, border: `1px solid ${C.border}`,
      flex: '1 1 160px',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: C.textMuted, textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: color || '#fff', fontFamily: "'Syne',sans-serif", lineHeight: 1.2 }}>{value}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted }}>{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const { tasks, projects, members } = useData()

  const stats = useMemo(() => {
    const total = tasks.length
    const done  = tasks.filter(t => t.status === 'done').length
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    const byStatus = Object.fromEntries(Object.keys(STATUS).map(s => [s, tasks.filter(t => t.status === s).length]))
    const byPriority = ['critical','high','medium','low'].map(p => ({ label: PRIORITY[p]?.label || p, count: tasks.filter(t => t.priority === p).length, color: PRIORITY[p]?.color }))
    const byProject = projects.map(p => ({
      name: p.name, color: p.color,
      total: tasks.filter(t => t.project_id === p.id).length,
      done:  tasks.filter(t => t.project_id === p.id && t.status === 'done').length,
    })).filter(p => p.total > 0).sort((a, b) => b.total - a.total)

    return { total, done, overdue, byStatus, byPriority, byProject }
  }, [tasks, projects])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: 24 }}>
        Analytics
      </h1>

      {/* Top stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total Tasks"  value={stats.total} />
        <StatCard label="Completed"    value={stats.done}    color={C.success} sub={stats.total ? `${Math.round(stats.done/stats.total*100)}% completion` : undefined} />
        <StatCard label="Overdue"      value={stats.overdue} color={stats.overdue > 0 ? C.danger : C.success} />
        <StatCard label="Projects"     value={projects.length} />
        <StatCard label="Team Members" value={members.length} />
      </div>

      {/* Completion by project */}
      {stats.byProject.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Project Progress</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.byProject.map(p => (
              <div key={p.name} style={{ padding: '14px 18px', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || C.accent }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{p.done}/{p.total} tasks</span>
                </div>
                <ProgressBar value={p.done} max={p.total || 1} color={p.color || C.accent} height={5} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status breakdown */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Tasks by Status</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} style={{
              flex: '1 1 120px', padding: '14px 18px',
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Syne',sans-serif" }}>
                {stats.byStatus[key] || 0}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Tasks by Priority</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.byPriority.filter(p => p.count > 0).map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.textMuted, width: 60, flexShrink: 0 }}>{p.label}</span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={p.count} max={stats.total || 1} color={p.color} height={6} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: p.color, width: 30, textAlign: 'right' }}>{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
