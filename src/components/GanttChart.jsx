import { useMemo, useRef, useState } from 'react'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Icon } from './UI'

const STATUS_COLOR = {
  new:        COLORS.textMuted || '#52525B',
  inprogress: '#60A5FA',
  review:     '#A78BFA',
  done:       '#3DD68C',
}

const PRIORITY_COLOR = {
  high:   '#F87171',
  medium: '#F5A623',
  low:    '#3DD68C',
}

function fmt(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000)
}

// ─── GanttChart ──────────────────────────────────────────────────────────────
// mode: 'projects' shows one row per project (uses earliest/latest task date)
// mode: 'tasks'    shows one row per task
export default function GanttChart({ rows, mode = 'tasks', title = 'Timeline' }) {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const { rangeStart, rangeEnd, totalDays, cols, items } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)

    // Collect all valid dates
    const allDates = []
    rows.forEach(r => {
      if (r.start) allDates.push(new Date(r.start + 'T00:00:00'))
      if (r.end)   allDates.push(new Date(r.end   + 'T00:00:00'))
    })

    // Default range: today ± 2 weeks if no data
    const rangeStart = allDates.length
      ? addDays(new Date(Math.min(...allDates)), -3)
      : addDays(today, -7)
    const rangeEnd = allDates.length
      ? addDays(new Date(Math.max(...allDates)), 5)
      : addDays(today, 21)

    rangeStart.setHours(0,0,0,0)
    rangeEnd.setHours(0,0,0,0)

    const totalDays = daysBetween(rangeStart, rangeEnd) + 1

    // Build column headers (weeks)
    const cols = []
    let cursor = new Date(rangeStart)
    while (cursor <= rangeEnd) {
      cols.push(new Date(cursor))
      cursor = addDays(cursor, 7)
    }

    // Build items with positions
    const items = rows.map(r => {
      const s = r.start ? new Date(r.start + 'T00:00:00') : null
      const e = r.end   ? new Date(r.end   + 'T00:00:00') : null
      const left  = s ? (daysBetween(rangeStart, s) / totalDays) * 100 : null
      const right = e ? (daysBetween(rangeStart, e) / totalDays) * 100 : null
      const width = (left !== null && right !== null) ? Math.max(right - left, 0.8) : null
      return { ...r, left, width, hasBar: left !== null && width !== null }
    })

    return { rangeStart, rangeEnd, totalDays, cols, items }
  }, [rows])

  const today = new Date(); today.setHours(0,0,0,0)
  const todayPct = (daysBetween(rangeStart, today) / totalDays) * 100

  const ROW_H = 36
  const LABEL_W = 180

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="barChart" size={14} color={COLORS.textMuted} />
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'Geist Mono', monospace", marginLeft: 4 }}>
          {fmt(rangeStart.toISOString().split('T')[0])} — {fmt(rangeEnd.toISOString().split('T')[0])}
        </span>
      </div>

      <div ref={containerRef} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ minWidth: 600 }}>

          {/* Column headers */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <div style={{ width: LABEL_W, flexShrink: 0, padding: '6px 14px', fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', borderRight: `1px solid ${COLORS.border}` }}>
              {mode === 'projects' ? 'Project' : 'Task'}
            </div>
            <div style={{ flex: 1, position: 'relative', height: 28 }}>
              {cols.map((d, i) => {
                const pct = (daysBetween(rangeStart, d) / totalDays) * 100
                return (
                  <div key={i} style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', paddingLeft: 4 }}>
                      {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rows */}
          {items.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
              No items with due dates to display
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={item.id || i}
                style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, height: ROW_H, alignItems: 'center' }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Label */}
                <div style={{ width: LABEL_W, flexShrink: 0, padding: '0 14px', borderRight: `1px solid ${COLORS.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 7 }}>
                  {item.color && (
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  )}
                  {item.status && !item.color && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[item.status] || COLORS.textMuted, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em', flex: 1 }}>
                    {item.label}
                  </span>
                </div>

                {/* Bar area */}
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  {/* Weekend / today lines */}
                  {todayPct >= 0 && todayPct <= 100 && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPct}%`, width: 1, background: COLORS.red + '60', zIndex: 1, pointerEvents: 'none' }} />
                  )}

                  {/* Gantt bar */}
                  {item.hasBar ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${item.left}%`,
                        width: `${item.width}%`,
                        top: '50%', transform: 'translateY(-50%)',
                        height: 20, borderRadius: 4,
                        background: item.color
                          ? item.color + 'CC'
                          : item.status === 'done'
                            ? COLORS.green + 'CC'
                            : STATUS_COLOR[item.status] + 'CC' || COLORS.textMuted + 'CC',
                        border: `1px solid ${item.color || STATUS_COLOR[item.status] || COLORS.border}`,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        paddingLeft: 6,
                        overflow: 'hidden',
                        transition: 'opacity 0.15s',
                        zIndex: 2,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = '0.8'
                        setTooltip({ item, x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().top })
                      }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; setTooltip(null) }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    // No date — show a diamond marker at today
                    <div style={{ position: 'absolute', left: `${todayPct}%`, top: '50%', transform: 'translate(-50%,-50%) rotate(45deg)', width: 8, height: 8, background: COLORS.textMuted, opacity: 0.4 }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today legend */}
      <div style={{ padding: '7px 14px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 2, background: COLORS.red + '80', borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>Today</span>
        </div>
        {mode === 'tasks' && (
          <>
            {Object.entries(STATUS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLOR[k] }} />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{v.label}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
