import { COLORS } from '../lib/constants'

export function Avatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},55%,32%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, userSelect: 'none',
    }}>{initials}</div>
  )
}

export function Badge({ color, children }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

export function ProgressBar({ tasks = [] }) {
  const done = tasks.filter(t => t.status === 'done').length
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{done}/{tasks.length} tasks</span>
        <span style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 600 }}>{pct}%</span>
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 28, width, maxWidth: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
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
  const bg = { primary: COLORS.accent, secondary: COLORS.bg, danger: '#450a0a', ghost: 'transparent' }
  const co = { primary: '#fff', secondary: COLORS.textDim, danger: COLORS.red, ghost: COLORS.textMuted }
  const bo = { primary: 'none', secondary: `1px solid ${COLORS.border}`, danger: `1px solid ${COLORS.red}44`, ghost: 'none' }
  const pd = { sm: '5px 12px', md: '8px 16px', lg: '11px 22px' }
  const fs = { sm: 12, md: 13, lg: 15 }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg[variant], color: co[variant], border: bo[variant],
      borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, padding: pd[size], fontSize: fs[size],
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'opacity 0.15s', ...x,
    }}>{children}</button>
  )
}

export function Toast({ toasts, onRemove }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onRemove(t.id)} style={{
          background: t.type === 'error' ? '#450a0a' : t.type === 'success' ? '#052e16' : COLORS.surface,
          border: `1px solid ${t.type === 'error' ? COLORS.red : t.type === 'success' ? COLORS.green : COLORS.border}`,
          borderRadius: 10, padding: '12px 16px', color: COLORS.text, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', maxWidth: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'slideIn 0.2s ease',
        }}>
          <span>{t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export const iStyle = {
  width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`,
  borderRadius: 8, padding: '8px 12px', color: COLORS.text, fontSize: 13, outline: 'none',
}
export const lStyle = {
  fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
  letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6,
}
