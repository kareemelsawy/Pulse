import { useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Icon } from '../components/UI'

function StatCard({ title, value, sub, color, icon }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '20px 22px', borderTop: `3px solid ${color || COLORS.accent}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
        <span style={{ color: COLORS.textDim, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: COLORS.border }}>
        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: color || COLORS.accent, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function DonutChart({ data, size = 120 }) {
  // Simple SVG donut chart
  const total = data.reduce((a, d) => a + d.value, 0)
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: COLORS.textMuted }}>No data</div>
  
  let offset = 0
  const r = 40, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const slices = data.map(d => {
    const pct = d.value / total
    const slice = { ...d, dasharray: `${pct * circ} ${circ}`, dashoffset: -offset * circ }
    offset += pct
    return slice
  })

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.border} strokeWidth="18" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="18"
          strokeDasharray={s.dasharray}
          strokeDashoffset={s.dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={COLORS.text}>{total}</text>
    </svg>
  )
}

export default function AnalyticsPage() {
  const { projects, tasks, members } = useData()

  const stats = useMemo(() => {
    const now = new Date()
    const done = tasks.filter(t => t.status === 'done')
    const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
    const completionRate = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0

    // Tasks completed per project
    const projectStats = projects.map(p => {
      const pt = tasks.filter(t => t.project_id === p.id)
      const pd = pt.filter(t => t.status === 'done')
      return { ...p, total: pt.length, done: pd.length, rate: pt.length > 0 ? Math.round((pd.length / pt.length) * 100) : 0 }
    }).sort((a, b) => b.total - a.total)

    // Tasks by status (for donut)
    const statusDist = Object.entries(STATUS).map(([k, v]) => ({
      label: v.label, value: tasks.filter(t => t.status === k).length, color: v.color
    }))

    // Tasks by priority
    const priorityDist = Object.entries(PRIORITY).map(([k, v]) => ({
      label: v.label, value: tasks.filter(t => t.priority === k).length, color: v.color
    }))

    // Assignee workload
    const assigneeMap = {}
    tasks.forEach(t => {
      if (!t.assignee_name) return
      if (!assigneeMap[t.assignee_name]) assigneeMap[t.assignee_name] = { total: 0, done: 0 }
      assigneeMap[t.assignee_name].total++
      if (t.status === 'done') assigneeMap[t.assignee_name].done++
    })
    const assigneeStats = Object.entries(assigneeMap).sort((a, b) => b[1].total - a[1].total).slice(0, 8)

    // Tasks created over last 30 days (bucketed by week)
    const weeks = [0, 0, 0, 0]
    tasks.forEach(t => {
      if (!t.created_at) return
      const daysAgo = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24))
      if (daysAgo < 7) weeks[3]++
      else if (daysAgo < 14) weeks[2]++
      else if (daysAgo < 21) weeks[1]++
      else if (daysAgo < 28) weeks[0]++
    })

    // Average task age (days since created for non-done tasks)
    const openTasks = tasks.filter(t => t.status !== 'done' && t.created_at)
    const avgAge = openTasks.length > 0
      ? Math.round(openTasks.reduce((a, t) => a + (now - new Date(t.created_at)) / (1000 * 60 * 60 * 24), 0) / openTasks.length)
      : 0

    // Due soon (next 7 days)
    const dueSoon = tasks.filter(t => {
      if (t.status === 'done' || !t.due_date) return false
      const days = (new Date(t.due_date) - now) / (1000 * 60 * 60 * 24)
      return days >= 0 && days <= 7
    })

    return { done, overdue, completionRate, projectStats, statusDist, priorityDist, assigneeStats, weeks, avgAge, dueSoon }
  }, [projects, tasks])

  const maxProjectTotal = Math.max(...stats.projectStats.map(p => p.total), 1)
  const maxWeek = Math.max(...stats.weeks, 1)

  const card = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22 }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', marginBottom: 6, paddingBottom: 2 }}>Analytics</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 28 }}>Task completion insights, workload distribution, and trends.</p>

        {/* Top KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard title="Total Tasks"       value={tasks.length}               sub={`across ${projects.length} projects`}    color={COLORS.accent}  icon="📋" />
          <StatCard title="Completion Rate"   value={`${stats.completionRate}%`} sub={`${stats.done.length} tasks done`}       color={COLORS.green}   icon={<Icon name="check" size={13} />} />
          <StatCard title="Overdue"           value={stats.overdue.length}       sub="need attention"                          color={stats.overdue.length > 0 ? COLORS.red : COLORS.green} icon={<Icon name="warning" size={13} />} />
          <StatCard title="Due This Week"     value={stats.dueSoon.length}       sub="tasks approaching deadline"              color={COLORS.amber}   icon="📅" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Status distribution */}
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, paddingBottom: 2 }}>Task Status Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart data={stats.statusDist} size={120} />
              <div style={{ flex: 1 }}>
                {stats.statusDist.map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: 13, color: COLORS.textDim }}>{d.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority breakdown */}
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, paddingBottom: 2 }}>Priority Breakdown</h3>
            <DonutChart data={stats.priorityDist} size={120} />
            <div style={{ marginTop: 16 }}>
              {stats.priorityDist.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 13, color: COLORS.textDim }}>{d.label}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly activity */}
        <div style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, paddingBottom: 2 }}>Tasks Created — Last 4 Weeks</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 100 }}>
            {stats.weeks.map((count, i) => {
              const pct = count / maxWeek
              const labels = ['4 weeks ago', '3 weeks ago', '2 weeks ago', 'This week']
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>{count}</span>
                  <div style={{ width: '100%', borderRadius: 6, background: COLORS.accent + (i === 3 ? 'ff' : '66'), height: Math.max(pct * 72, count > 0 ? 8 : 4), transition: 'height 0.5s ease' }} />
                  <span style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'center', lineHeight: 1.3 }}>{labels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Project progress */}
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, paddingBottom: 2 }}>Project Progress</h3>
            {stats.projectStats.length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No projects yet</div>
            ) : stats.projectStats.map(p => (
              <div key={p.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{p.done}/{p.total} ({p.rate}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: COLORS.border }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${p.rate}%`, background: p.color, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Assignee workload */}
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, paddingBottom: 2 }}>Team Workload</h3>
            {stats.assigneeStats.length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No assigned tasks yet</div>
            ) : stats.assigneeStats.map(([name, data]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                  {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{data.done}/{data.total} done</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: COLORS.border }}>
                    <div style={{ height: '100%', borderRadius: 3, background: COLORS.green, width: `${data.total > 0 ? (data.done / data.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ ...card, borderTop: `3px solid ${COLORS.purple}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Avg Task Age</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{stats.avgAge}d</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>average days open tasks have been open</div>
          </div>
          <div style={{ ...card, borderTop: `3px solid ${COLORS.amber}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Unassigned Tasks</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
              {tasks.filter(t => !t.assignee_name && t.status !== 'done').length}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>open tasks with no assignee</div>
          </div>
          <div style={{ ...card, borderTop: `3px solid ${COLORS.green}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Team Members</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{members.length}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{Math.round(tasks.length / Math.max(members.length, 1))} tasks per member avg</div>
          </div>
        </div>

        {/* Overdue tasks list */}
        {stats.overdue.length > 0 && (
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, paddingBottom: 2, color: COLORS.red }}>Overdue Tasks ({stats.overdue.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.overdue.slice(0, 8).map(t => {
                const daysAgo = Math.floor((new Date() - new Date(t.due_date)) / (1000 * 60 * 60 * 24))
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</div>
                      {t.assignee_name && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Assigned to {t.assignee_name}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: COLORS.red, fontWeight: 600, whiteSpace: 'nowrap' }}>{daysAgo}d overdue</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
