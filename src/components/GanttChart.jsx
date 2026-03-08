import { useMemo, useRef, useState } from 'react'
import { COLORS, STATUS } from '../lib/constants'
import { Icon } from './UI'

const STATUS_COLOR = {
  new:        '#52525B',
  inprogress: '#4F8EF7',
  review:     '#A78BFA',
  done:       '#22C55E',
}

function fmt(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function daysBetween(a, b) { return Math.round((b - a) / 86400000) }

// mode: 'projects' | 'tasks'
export default function GanttChart({ rows, mode = 'tasks', title = 'Timeline' }) {
  const { rangeStart, rangeEnd, totalDays, cols, items } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const allDates = []
    rows.forEach(r => {
      if (r.start) allDates.push(new Date(r.start + 'T00:00:00'))
      if (r.end)   allDates.push(new Date(r.end   + 'T00:00:00'))
    })
    const rangeStart = allDates.length ? addDays(new Date(Math.min(...allDates)), -3) : addDays(today, -7)
    const rangeEnd   = allDates.length ? addDays(new Date(Math.max(...allDates)),  5) : addDays(today, 21)
    rangeStart.setHours(0,0,0,0); rangeEnd.setHours(0,0,0,0)
    const totalDays = daysBetween(rangeStart, rangeEnd) + 1
    const cols = []
    let cur = new Date(rangeStart)
    while (cur <= rangeEnd) { cols.push(new Date(cur)); cur = addDays(cur, 7) }
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
  const LABEL_W = 180

  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="barChart" size={14} color={COLORS.textMuted} />
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'monospace', marginLeft: 4 }}>
          {fmt(rangeStart.toISOString().split('T')[0])} — {fmt(rangeEnd.toISOString().split('T')[0])}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 600 }}>
          {/* Column headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, padding: '5px 14px', fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              {mode === 'projects' ? 'Project' : 'Task'}
            </div>
            <div style={{ flex: 1, position: 'relative', height: 26 }}>
              {cols.map((d, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(daysBetween(rangeStart, d) / totalDays) * 100}%`, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: 'monospace', whiteSpace: 'nowrap', paddingLeft: 4 }}>
                    {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Rows */}
          {items.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No items with due dates to display</div>
          ) : items.map((item, i) => (
            <div key={item.id || i} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', height: 36, alignItems: 'center' }}>
              <div style={{ width: LABEL_W, flexShrink: 0, padding: '0 14px', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 7 }}>
                {item.color && <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />}
                {!item.color && item.status && <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[item.status] || COLORS.textMuted, flexShrink: 0 }} />}
                <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>
              </div>
              <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                {todayPct >= 0 && todayPct <= 100 && (
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPct}%`, width: 1, background: COLORS.red + '70', zIndex: 1, pointerEvents: 'none' }} />
                )}
                {item.hasBar && (
                  <div style={{
                    position: 'absolute',
                    left: `${item.left}%`, width: `${item.width}%`,
                    top: '50%', transform: 'translateY(-50%)',
                    height: 18, borderRadius: 4,
                    background: item.color
                      ? item.color + 'CC'
                      : (STATUS_COLOR[item.status] || COLORS.textMuted) + 'CC',
                    border: `1px solid ${item.color || STATUS_COLOR[item.status] || COLORS.border}`,
                    display: 'flex', alignItems: 'center', paddingLeft: 6,
                    overflow: 'hidden', zIndex: 2,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ padding: '6px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 2, background: COLORS.red + '80', borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>Today</span>
        </div>
        {mode === 'tasks' && Object.entries(STATUS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLOR[k] }} />
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
