import { COLORS } from '../lib/constants'

export function Avatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},55%,42%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      flexShrink: 0, userSelect: 'none', lineHeight: 1,
      paddingBottom: 1, // fix baseline clipping
    }}>{initials}</div>
  )
}

export function Badge({ color, children }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap', lineHeight: 1.4, display: 'inline-flex', alignItems: 'center',
    }}>{children}</span>
  )
}

export function ProgressBar({ tasks = [] }) {
  const done = tasks.filter(t => t.status === 'done').length
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{done}/{tasks.length} tasks</span>
        <span style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 600, lineHeight: 1.4 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: COLORS.border }}>
        <div style={{
          height: '100%', borderRadius: 2, width: `${pct}%`,
          background: pct === 100 ? COLORS.green : COLORS.accent,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

export function Modal({ children, onClose, width = 500 }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 28, width, maxWidth: '100%',
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: `0 24px 64px ${COLORS.shadow}`,
        animation: 'slideUp 0.2s ease',
      }}>
        {children}
      </div>
    </div>
  )
}

export function Spinner({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${COLORS.border}`,
      borderTop: `2px solid ${COLORS.accent}`,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    }} />
  )
}

export function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
      background: value ? COLORS.accent : COLORS.border,
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: value ? 20 : 2,
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style: x }) {
  const bg = { primary: COLORS.accent, secondary: COLORS.bg, danger: COLORS.red + '22', ghost: 'transparent' }
  const co = { primary: '#fff', secondary: COLORS.textDim, danger: COLORS.red, ghost: COLORS.textMuted }
  const bo = { primary: 'none', secondary: `1px solid ${COLORS.border}`, danger: `1px solid ${COLORS.red}44`, ghost: 'none' }
  const pd = { sm: '5px 12px', md: '8px 16px', lg: '11px 22px' }
  const fs = { sm: 12, md: 13, lg: 15 }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg[variant], color: co[variant], border: bo[variant],
      borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, padding: pd[size], fontSize: fs[size],
      display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1.4,
      transition: 'opacity 0.15s', ...x,
    }}>{children}</button>
  )
}

export function Toast({ toasts, onRemove }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onRemove(t.id)} style={{
          background: t.type === 'error' ? COLORS.red + '18' : t.type === 'success' ? COLORS.green + '18' : COLORS.surface,
          border: `1px solid ${t.type === 'error' ? COLORS.red : t.type === 'success' ? COLORS.green : COLORS.border}`,
          borderRadius: 10, padding: '12px 16px', color: COLORS.text, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', maxWidth: 320,
          boxShadow: `0 8px 32px ${COLORS.shadow}`, animation: 'slideIn 0.2s ease',
        }}>
          <span style={{ color: t.type === 'error' ? COLORS.red : t.type === 'success' ? COLORS.green : COLORS.textMuted }}>
            {t.type === 'error' ? <Icon name="x" size={14} /> : t.type === 'success' ? <Icon name="check" size={14} /> : <Icon name="warning" size={14} />}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

// Functions so they always read current COLORS (theme-safe)
export const iStyle = {
  get width() { return '100%' },
  get background() { return COLORS.inputBg },
  get border() { return `1px solid ${COLORS.border}` },
  borderRadius: 8, padding: '8px 12px',
  get color() { return COLORS.text },
  fontSize: 13, outline: 'none', lineHeight: 1.5,
}
export const lStyle = {
  fontSize: 11, fontWeight: 700,
  get color() { return COLORS.textMuted },
  letterSpacing: '0.06em', textTransform: 'uppercase',
  display: 'block', marginBottom: 6, lineHeight: 1.4,
}

// ─── SVG Icon set ─────────────────────────────────────────────────────────────
// Monotone, stroke-based icons. size in px, color defaults to currentColor.
export function Icon({ name, size = 16, color = 'currentColor', style: s }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'inline-block', flexShrink: 0, ...s } }
  const icons = {
    grid:        <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    tasks:       <svg {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>,
    barChart:    <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    settings:    <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    warning:     <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check:       <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>,
    x:           <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus:        <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    folder:      <svg {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    upload:      <svg {...props}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    paperclip:   <svg {...props}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    messageCircle: <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    inbox:       <svg {...props}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    logo:        <svg {...props} strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    arrowRight:  <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    priorityHigh:<svg {...props} strokeWidth={2.5} stroke={color}><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>,
    priorityMed: <svg {...props} strokeWidth={2.5} stroke={color}><polyline points="17 13 12 8 7 13"/><line x1="7" y1="18" x2="17" y2="18"/></svg>,
    priorityLow: <svg {...props} strokeWidth={2.5} stroke={color}><line x1="7" y1="6" x2="17" y2="6"/><polyline points="7 11 12 16 17 11"/></svg>,
    list:        <svg {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    board:       <svg {...props}><rect x="3" y="3" width="5" height="18"/><rect x="10" y="3" width="5" height="11"/><rect x="17" y="3" width="5" height="15"/></svg>,
    edit:        <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    sun:         <svg {...props}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:        <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    user:        <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    download:    <svg {...props}><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    clock:       <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    sunrise:     <svg {...props}><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>,
  }
  return icons[name] || <svg {...props}><circle cx="12" cy="12" r="9"/></svg>
}
