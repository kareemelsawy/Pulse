import { COLORS } from '../lib/constants'

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const hues = [211, 271, 142, 35, 4, 340, 199, 231]
  const hue = hues[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length]
  const lightColors = [`hsl(${hue},72%,52%)`, `hsl(${hue},68%,46%)`]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(145deg, ${lightColors[0]}, ${lightColors[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.37, fontWeight: 600, color: '#fff',
      flexShrink: 0, userSelect: 'none', lineHeight: 1,
      letterSpacing: '-0.02em',
      boxShadow: `0 1px 3px rgba(0,0,0,0.2)`,
    }}>{initials}</div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ color, children }) {
  return (
    <span style={{
      background: color + '18', color,
      borderRadius: 20, padding: '2px 9px',
      fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap', lineHeight: 1.5,
      display: 'inline-flex', alignItems: 'center',
      letterSpacing: '-0.01em',
    }}>{children}</span>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ tasks = [] }) {
  const done = tasks.filter(t => t.status === 'done').length
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Mono', monospace" }}>{done}/{tasks.length} tasks</span>
        <span style={{ fontSize: 11, color: pct === 100 ? COLORS.green : COLORS.textDim, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 100, background: COLORS.border, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 100,
          width: `${pct}%`,
          background: pct === 100
            ? COLORS.green
            : `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.blue || COLORS.accent})`,
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, width = 540 }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.surface,
        borderRadius: 20,
        padding: 28,
        width, maxWidth: '100%',
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: COLORS.modalShadow || COLORS.cardShadow,
        border: `1px solid ${COLORS.border}`,
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${COLORS.border}`,
      borderTop: `2px solid ${COLORS.accent}`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      role="switch" aria-checked={value}
      style={{
        width: 44, height: 26, borderRadius: 100, cursor: 'pointer',
        background: value ? COLORS.accent : COLORS.border,
        position: 'relative',
        transition: 'background 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        boxShadow: value ? `0 0 0 0px ${COLORS.accent}` : 'none',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: '#FFFFFF',
        position: 'absolute', top: 3, left: value ? 21 : 3,
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style: x }) {
  const v = {
    primary:   {
      bg: COLORS.accent,
      color: '#fff',
      border: 'none',
      shadow: `0 1px 3px rgba(0,122,255,0.35)`,
    },
    secondary: {
      bg: COLORS.surfaceHover,
      color: COLORS.textDim,
      border: `1px solid ${COLORS.border}`,
      shadow: 'none',
    },
    danger:    {
      bg: COLORS.red + '12',
      color: COLORS.red,
      border: `1px solid ${COLORS.red}25`,
      shadow: 'none',
    },
    ghost:     {
      bg: 'transparent',
      color: COLORS.accent,
      border: 'none',
      shadow: 'none',
    },
  }
  const pd = { sm: '5px 13px', md: '8px 17px', lg: '11px 24px' }
  const fs = { sm: 12, md: 13, lg: 15 }
  const s = v[variant] || v.primary
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: s.bg, color: s.color, border: s.border,
        borderRadius: 10, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        padding: pd[size], fontSize: fs[size],
        display: 'inline-flex', alignItems: 'center', gap: 6,
        lineHeight: 1.4,
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Mona Sans', sans-serif",
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        boxShadow: disabled ? 'none' : s.shadow,
        ...x,
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.filter = 'brightness(0.93)'
        e.currentTarget.style.transform = 'translateY(-0.5px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = ''
        e.currentTarget.style.transform = ''
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = '' }}
    >{children}</button>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ toasts, onRemove }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onRemove(t.id)} style={{
          background: COLORS.surface,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${t.type === 'error' ? COLORS.red + '30' : t.type === 'success' ? COLORS.green + '30' : COLORS.border}`,
          borderRadius: 14,
          padding: '12px 16px',
          color: COLORS.text,
          fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', maxWidth: 320,
          boxShadow: COLORS.cardShadow,
          animation: 'slideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          fontWeight: 500,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: t.type === 'error' ? COLORS.red + '18' : t.type === 'success' ? COLORS.green + '18' : COLORS.border,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12,
          }}>
            {t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : '·'}
          </div>
          <span style={{ flex: 1, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style: s }) {
  return <div style={{ height: 1, background: COLORS.border, ...s }} />
}

// ─── Input/Label styles ───────────────────────────────────────────────────────
export const iStyle = {
  get width() { return '100%' },
  get background() { return COLORS.inputBg || COLORS.surfaceHover },
  get border() { return `1px solid ${COLORS.inputBorder || COLORS.border}` },
  borderRadius: 10,
  padding: '9px 13px',
  get color() { return COLORS.text },
  fontSize: 14,
  outline: 'none',
  lineHeight: 1.5,
  fontFamily: "'Mona Sans', sans-serif",
  letterSpacing: '-0.01em',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export const lStyle = {
  fontSize: 12,
  fontWeight: 600,
  get color() { return COLORS.textMuted },
  letterSpacing: '-0.01em',
  display: 'block',
  marginBottom: 6,
  lineHeight: 1.4,
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
export function Icon({ name, size = 16, color = 'currentColor', style: s }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'inline-block', flexShrink: 0, ...s },
  }
  const icons = {
    grid:          <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    tasks:         <svg {...p}><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l.5.5L6 5M4 12l.5.5L6 11M4 18l.5.5L6 17" strokeWidth="2"/></svg>,
    barChart:      <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    settings:      <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    warning:       <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check:         <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    x:             <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus:          <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    folder:        <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    upload:        <svg {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    paperclip:     <svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    messageCircle: <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    inbox:         <svg {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    arrowRight:    <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    chevronRight:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    chevronDown:   <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>,
    priorityHigh:  <svg {...p} strokeWidth={2.2}><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>,
    priorityMed:   <svg {...p} strokeWidth={2.2}><polyline points="17 13 12 8 7 13"/><line x1="7" y1="18" x2="17" y2="18"/></svg>,
    priorityLow:   <svg {...p} strokeWidth={2.2}><line x1="7" y1="6" x2="17" y2="6"/><polyline points="7 11 12 16 17 11"/></svg>,
    list:          <svg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    board:         <svg {...p}><rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="11" rx="1.5"/><rect x="17" y="3" width="5" height="15" rx="1.5"/></svg>,
    edit:          <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    sun:           <svg {...p}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>,
    moon:          <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    user:          <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    fileText:      <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    download:      <svg {...p}><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    clock:         <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    sunrise:       <svg {...p}><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>,
    zap:           <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    eye:           <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff:        <svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    mail:          <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    bell:          <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    trash:         <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    search:        <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  }
  return icons[name] || <svg {...p}><circle cx="12" cy="12" r="9"/></svg>
}
