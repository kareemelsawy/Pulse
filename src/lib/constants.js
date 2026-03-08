// ─── Theme colors ─────────────────────────────────────────────────────────────

export const DARK_THEME = {
  bg:          '#060a14',
  bgCard:      'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',
  sidebar:     'rgba(6,10,20,0.85)',
  header:      'rgba(6,10,20,0.80)',
  border:      'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  text:        '#ffffff',
  textMuted:   'rgba(255,255,255,0.45)',
  textFaint:   'rgba(255,255,255,0.22)',
  accent:      '#4F8EF7',
  accentBg:    'rgba(79,142,247,0.14)',
  accentHover: '#6B9EF8',
  success:     '#22c55e',
  successBg:   'rgba(34,197,94,0.12)',
  warn:        '#f59e0b',
  warnBg:      'rgba(245,158,11,0.12)',
  danger:      '#ef4444',
  dangerBg:    'rgba(239,68,68,0.12)',
  inputBg:     'rgba(255,255,255,0.05)',
}

// Light theme kept for interface compatibility but never applied (dark-only app)
export const LIGHT_THEME = DARK_THEME

// Legacy mutable COLORS object — mutated by setThemeColors()
export let COLORS = { ...DARK_THEME }

export function setThemeColors(isDark) {
  const theme = DARK_THEME // always dark
  Object.assign(COLORS, theme)
}

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS = {
  new:        { label: 'New',        color: '#52525B', bg: 'rgba(82,82,91,0.15)'   },
  inprogress: { label: 'In Progress',color: '#4F8EF7', bg: 'rgba(79,142,247,0.15)' },
  review:     { label: 'Review',     color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  done:       { label: 'Done',       color: '#22C55E', bg: 'rgba(34,197,94,0.15)'  },
}

export const STATUS_FLOW = {
  new:        'inprogress',
  inprogress: 'review',
  review:     'done',
  done:       'new',
}

// ─── Priority ─────────────────────────────────────────────────────────────────

export const PRIORITY = {
  critical: { label: 'Critical', color: '#ef4444' },
  high:     { label: 'High',     color: '#f97316' },
  medium:   { label: 'Medium',   color: '#eab308' },
  low:      { label: 'Low',      color: '#22c55e' },
}

// ─── Project colors ───────────────────────────────────────────────────────────

export const PROJECT_COLORS = [
  '#4F8EF7', '#A78BFA', '#34D399', '#F472B6',
  '#FB923C', '#38BDF8', '#FBBF24', '#F87171',
  '#6EE7B7', '#C084FC', '#60A5FA', '#FCD34D',
]
