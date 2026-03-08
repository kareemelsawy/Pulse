// ─── Theme system ─────────────────────────────────────────────────────────────
export const DARK_THEME = {
  bg: '#0A0A0B',
  surface: '#111113',
  surfaceHover: '#1A1A1C',
  border: '#1F1F23',
  borderStrong: '#2A2A2F',
  accent: '#EDEDEF',
  accentDim: '#1A1A1C',
  green: '#3DD68C',
  amber: '#F5A623',
  red: '#F87171',
  purple: '#A78BFA',
  blue: '#60A5FA',
  text: '#EDEDEF',
  textMuted: '#52525B',
  textDim: '#A1A1AA',
  inputBg: '#0A0A0B',
  shadow: 'rgba(0,0,0,0.8)',
  cardShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.6)',
}

export const LIGHT_THEME = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceHover: '#F4F4F5',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  accent: '#18181B',
  accentDim: '#F4F4F5',
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
  purple: '#7C3AED',
  blue: '#2563EB',
  text: '#09090B',
  textMuted: '#A1A1AA',
  textDim: '#52525B',
  inputBg: '#FAFAFA',
  shadow: 'rgba(0,0,0,0.06)',
  cardShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 0 rgba(0,0,0,0.04)',
}

export let COLORS = { ...DARK_THEME }
export function setThemeColors(isDark) {
  const t = isDark ? DARK_THEME : LIGHT_THEME
  Object.keys(t).forEach(k => { COLORS[k] = t[k] })
}

export const PRIORITY = {
  high:   { label: 'High',   color: '#EF4444', icon: '↑↑' },
  medium: { label: 'Medium', color: '#F59E0B', icon: '↑'  },
  low:    { label: 'Low',    color: '#22C55E', icon: '↓'  },
}

export const STATUS = {
  new:        { label: 'New',         color: '#475569', next: 'inprogress' },
  inprogress: { label: 'In Progress', color: '#4F8EF7', next: 'review'     },
  review:     { label: 'Review',      color: '#A78BFA', next: 'done'       },
  done:       { label: 'Done',        color: '#22C55E', next: null         },
}

export const STATUS_FLOW = ['new', 'inprogress', 'review', 'done']

export const PROJECT_COLORS = [
  '#4F8EF7', '#A78BFA', '#22C55E', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
]

export const NOTIFICATION_TRIGGERS = {
  task_assigned: { label: 'Task Assigned',     desc: 'When a task is assigned to a member' },
  status_changed:{ label: 'Status Changed',    desc: 'When a task status changes' },
  task_completed:{ label: 'Task Completed',    desc: 'When a task is marked done' },
  new_task:      { label: 'New Task Created',  desc: 'When a new task is added' },
}
