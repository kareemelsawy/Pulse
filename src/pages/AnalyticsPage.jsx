import { useMemo, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Icon, Modal, Badge } from '../components/UI'
import GanttChart from '../components/GanttChart'

// ─── Drill-down modal ─────────────────────────────────────────────────────────
function DrillModal({ title, tasks, projects, onClose }) {
  if (!tasks || tasks.length === 0) return null
  return (
    <Modal onClose={onClose} width={620}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: COLORS.textMuted }}>
          <Icon name="x" size={18} color={COLORS.textMuted} />
        </button>
      </div>
      <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.map(t => {
          const proj = projects.find(p => p.id === t.project_id)
          const daysOverdue = t.due_date && t.status !== 'done'
            ? Math.floor((new Date() - new Date(t.due_date)) / 86400000)
            : null
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              {proj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? COLORS.textMuted : COLORS.text }}>{t.title}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {proj && <span>{proj.name}</span>}
                  {t.assignee_name && <span>· {t.assignee_name}</span>}
                  {t.due_date && <span>· Due {t.due_date}</span>}
                  {daysOverdue > 0 && <span style={{ color: COLORS.red, fontWeight: 600 }}>· {daysOverdue}d overdue</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: (PRIORITY[t.priority]?.color || '#888') + '22', color: PRIORITY[t.priority]?.color || '#888' }}>{PRIORITY[t.priority]?.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

// ─── Clickable stat card ──────────────────────────────────────────────────────
function StatCard({ title, value, sub, tasks, onClick }) {
  const clickable = onClick && tasks?.length > 0
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{ background: COLORS.surfaceHover, backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: `1px solid ${COLORS.borderStrong}`, borderRadius: 16, padding: '20px 22px', cursor: clickable ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.borderColor = COLORS.accent + '88' }}
      onMouseLeave={e => { if (clickable) e.currentTarget.style.borderColor = COLORS.borderStrong }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        {clickable && <Icon name="chevronRight" size={12} color={COLORS.textMuted} />}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted }}>{sub}</div>}
    </div>
  )
}

// ─── Donut chart with clickable slices ────────────────────────────────────────
function DonutChart({ data, size = 120, onSliceClick }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: COLORS.textMuted }}>No data</div>

  let offset = 0
  const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r
  const slices = data.map(d => {
    const pct   = d.value / total
    const slice = { ...d, dasharray: `${pct * circ} ${circ}`, dashoffset: -offset * circ }
    offset += pct
    return slice
  })

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="18" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="18"
          strokeDasharray={s.dasharray}
          strokeDashoffset={s.dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.5s ease, opacity 0.15s', cursor: s.value > 0 && onSliceClick ? 'pointer' : 'default' }}
          onMouseEnter={e => { if (s.value > 0 && onSliceClick) e.target.style.opacity = '0.7' }}
          onMouseLeave={e => { e.target.style.opacity = '1' }}
          onClick={() => s.value > 0 && onSliceClick && onSliceClick(s)}
        />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={COLORS.text}>{total}</text>
    </svg>
  )
}

function displayName(raw) {
  if (!raw) return '?'
  if (raw.includes('@')) return raw.split('@')[0].split(/[._-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  return raw
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { projects, tasks, members, isAdmin, isPM, myProjects } = useData()
  const { user } = useAuth()
  const [drill, setDrill] = useState(null)

  const scopedProjects = isAdmin ? projects.filter(p => !p.is_pipeline) : myProjects

  // Analytics needs ALL tasks including done — myTasks strips done tasks so we re-derive here
  const scopedTasks = isAdmin
    ? tasks
    : isPM
      ? tasks.filter(t => scopedProjects.some(p => p.id === t.project_id))
      : tasks.filter(t => t.assignee_email?.toLowerCase() === user?.email?.toLowerCase())

  const stats = useMemo(() => {
    const now      = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const doneTasks    = scopedTasks.filter(t => t.status === 'done')
    const overdueTasks = scopedTasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr)
    const completionRate = scopedTasks.length > 0 ? Math.round((doneTasks.length / scopedTasks.length) * 100) : 0

    const statusDist = Object.entries(STATUS).map(([k, v]) => ({
      key: k, label: v.label, color: v.color,
      value: scopedTasks.filter(t => t.status === k).length,
      tasks: scopedTasks.filter(t => t.status === k),
    }))

    const priorityDist = Object.entries(PRIORITY).map(([k, v]) => ({
      key: k, label: v.label, color: v.color,
      value: scopedTasks.filter(t => t.priority === k).length,
      tasks: scopedTasks.filter(t => t.priority === k),
    }))

    const projectStats = scopedProjects.map(p => {
      const pt   = scopedTasks.filter(t => t.project_id === p.id)
      const pd   = pt.filter(t => t.status === 'done')
      const open = pt.filter(t => t.status !== 'done')
      return { ...p, total: pt.length, done: pd.length, openTasks: open, allTasks: pt, rate: pt.length > 0 ? Math.round((pd.length / pt.length) * 100) : 0 }
    }).sort((a, b) => b.total - a.total)

    const assigneeMap = {}
    scopedTasks.forEach(t => {
      const key = t.assignee_name || null
      if (!key) return
      if (!assigneeMap[key]) assigneeMap[key] = { total: 0, done: 0, tasks: [] }
      assigneeMap[key].total++
      assigneeMap[key].tasks.push(t)
      if (t.status === 'done') assigneeMap[key].done++
    })
    const assigneeStats = Object.entries(assigneeMap).sort((a, b) => b[1].total - a[1].total).slice(0, 8)

    const weekLabels  = ['4 weeks ago', '3 weeks ago', '2 weeks ago', 'This week']
    const weekBuckets = [[], [], [], []]
    scopedTasks.forEach(t => {
      if (!t.created_at) return
      const daysAgo = Math.floor((now - new Date(t.created_at)) / 86400000)
      if      (daysAgo < 7)  weekBuckets[3].push(t)
      else if (daysAgo < 14) weekBuckets[2].push(t)
      else if (daysAgo < 21) weekBuckets[1].push(t)
      else if (daysAgo < 28) weekBuckets[0].push(t)
    })

    const openAgeTasks = scopedTasks.filter(t => t.status !== 'done' && t.created_at)
    const avgAge = openAgeTasks.length > 0
      ? Math.round(openAgeTasks.reduce((a, t) => a + (now - new Date(t.created_at)) / 86400000, 0) / openAgeTasks.length)
      : 0

    const dueSoon = scopedTasks.filter(t => {
      if (t.status === 'done' || !t.due_date) return false
      const days = (new Date(t.due_date) - now) / 86400000
      return days >= 0 && days <= 7
    })

    const unassigned = scopedTasks.filter(t => !t.assignee_name && t.status !== 'done')

    return { doneTasks, overdueTasks, completionRate, projectStats, statusDist, priorityDist, assigneeStats, weekBuckets, weekLabels, avgAge, dueSoon, unassigned, openAgeTasks }
  }, [scopedProjects, scopedTasks])

  const maxWeek = Math.max(...stats.weekBuckets.map(b => b.length), 1)
  const card    = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22 }

  function openDrill(title, taskList) {
    if (taskList?.length > 0) setDrill({ title, tasks: taskList })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', marginBottom: 6 }}>Analytics</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 28 }}>Task completion insights, workload distribution, and trends.</p>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard title="Total Tasks"   value={scopedTasks.length}        sub={`across ${scopedProjects.length} program${scopedProjects.length !== 1 ? 's' : ''}`} tasks={scopedTasks}        onClick={() => openDrill('All Tasks', scopedTasks)} />
          <StatCard title="Completed"     value={stats.doneTasks.length}    sub={`${stats.completionRate}% completion rate`}                                          tasks={stats.doneTasks}    onClick={() => openDrill('Completed Tasks', stats.doneTasks)} />
          <StatCard title="Overdue"       value={stats.overdueTasks.length} sub="need attention"                                                                      tasks={stats.overdueTasks} onClick={() => openDrill('Overdue Tasks', stats.overdueTasks)} />
          <StatCard title="Due This Week" value={stats.dueSoon.length}      sub="approaching deadline"                                                                tasks={stats.dueSoon}      onClick={() => openDrill('Due This Week', stats.dueSoon)} />
        </div>

        {/* ── Donuts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Task Status Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart data={stats.statusDist} size={120} onSliceClick={s => openDrill(`Status: ${s.label}`, s.tasks)} />
              <div style={{ flex: 1 }}>
                {stats.statusDist.map(d => (
                  <div key={d.key} onClick={() => openDrill(`Status: ${d.label}`, d.tasks)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '4px 8px', borderRadius: 7, cursor: d.value > 0 ? 'pointer' : 'default', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (d.value > 0) e.currentTarget.style.background = COLORS.surfaceHover }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
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

          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Priority Breakdown</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart data={stats.priorityDist} size={120} onSliceClick={s => openDrill(`Priority: ${s.label}`, s.tasks)} />
              <div style={{ flex: 1 }}>
                {stats.priorityDist.map(d => (
                  <div key={d.key} onClick={() => openDrill(`Priority: ${d.label}`, d.tasks)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '4px 8px', borderRadius: 7, cursor: d.value > 0 ? 'pointer' : 'default', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (d.value > 0) e.currentTarget.style.background = COLORS.surfaceHover }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
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
        </div>

        {/* ── Weekly activity ── */}
        <div style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Tasks Created — Last 4 Weeks</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 100 }}>
            {stats.weekBuckets.map((bucket, i) => {
              const count = bucket.length
              const pct   = count / maxWeek
              return (
                <div key={i} onClick={() => openDrill(`Created: ${stats.weekLabels[i]}`, bucket)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: count > 0 ? 'pointer' : 'default' }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>{count}</span>
                  <div style={{ width: '100%', borderRadius: 6, background: COLORS.accent + (i === 3 ? 'ff' : '66'), height: Math.max(pct * 72, count > 0 ? 8 : 4), transition: 'height 0.5s ease, opacity 0.15s' }}
                    onMouseEnter={e => { if (count > 0) e.currentTarget.style.opacity = '0.75' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  />
                  <span style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'center', lineHeight: 1.3 }}>{stats.weekLabels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Project progress + Team workload ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Project Progress</h3>
            {stats.projectStats.length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No projects yet</div>
            ) : stats.projectStats.map(p => (
              <div key={p.id} onClick={() => openDrill(`${p.name} — Open Tasks`, p.openTasks)}
                style={{ marginBottom: 14, padding: '6px 8px', borderRadius: 8, cursor: p.openTasks.length > 0 ? 'pointer' : 'default', transition: 'background 0.12s' }}
                onMouseEnter={e => { if (p.openTasks.length > 0) e.currentTarget.style.background = COLORS.surfaceHover }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{p.done}/{p.total} ({p.rate}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.10)' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${p.rate}%`, background: p.color, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Team Workload</h3>
            {stats.assigneeStats.length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No assigned tasks yet</div>
            ) : stats.assigneeStats.map(([name, data]) => (
              <div key={name} onClick={() => openDrill(`${displayName(name)}'s Tasks`, data.tasks)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = COLORS.surfaceHover }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                  {displayName(name).slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{displayName(name)}</span>
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

        {/* ── Insights row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          <div onClick={() => openDrill('Open Tasks by Age', stats.openAgeTasks)}
            style={{ background: COLORS.surfaceHover, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${COLORS.borderStrong}`, borderRadius: 16, padding: '20px 22px', cursor: stats.openAgeTasks.length > 0 ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { if (stats.openAgeTasks.length > 0) e.currentTarget.style.borderColor = COLORS.accent + '88' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.borderStrong }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Avg Task Age</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{stats.avgAge}d</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>average days open tasks have been open</div>
          </div>
          <div onClick={() => openDrill('Unassigned Tasks', stats.unassigned)}
            style={{ background: COLORS.surfaceHover, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${COLORS.borderStrong}`, borderRadius: 16, padding: '20px 22px', cursor: stats.unassigned.length > 0 ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { if (stats.unassigned.length > 0) e.currentTarget.style.borderColor = COLORS.accent + '88' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.borderStrong }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Unassigned Tasks</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{stats.unassigned.length}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>open tasks with no assignee</div>
          </div>
          <div style={{ background: COLORS.surfaceHover, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${COLORS.borderStrong}`, borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Team Members</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{members.length}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{scopedTasks.length > 0 ? Math.round(scopedTasks.length / Math.max(members.length, 1)) : 0} tasks per member avg</div>
          </div>
        </div>

        {/* ── Overdue list ── */}
        {stats.overdueTasks.length > 0 && (
          <div style={{ ...card, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: COLORS.red }}>Overdue Tasks ({stats.overdueTasks.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.overdueTasks.slice(0, 8).map(t => {
                const daysAgo = Math.floor((new Date() - new Date(t.due_date)) / 86400000)
                const proj    = scopedProjects.find(p => p.id === t.project_id)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                    {proj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
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

        {/* ── Gantts ── */}
        <GanttChart
          title="All Projects — Timeline"
          mode="projects"
          rows={scopedProjects.map(p => {
            const ptasks = scopedTasks.filter(t => t.project_id === p.id && t.due_date)
            const dates  = ptasks.map(t => t.due_date).sort()
            const start  = ptasks.find(t => t.created_at)?.created_at?.split('T')[0] || dates[0] || null
            return { id: p.id, label: p.name, color: p.color, start, end: dates[dates.length - 1] || null }
          })}
        />
        <GanttChart
          title="All Tasks — Timeline"
          mode="tasks"
          rows={scopedTasks.filter(t => t.due_date).map(t => ({
            id: t.id, label: t.title, status: t.status,
            start: t.created_at?.split('T')[0] || t.due_date,
            end: t.due_date,
          }))}
        />
      </div>

      {drill && <DrillModal title={drill.title} tasks={drill.tasks} projects={scopedProjects} onClose={() => setDrill(null)} />}
    </div>
  )
}
