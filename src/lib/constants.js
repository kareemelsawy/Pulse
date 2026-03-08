// ─── Theme system ─────────────────────────────────────────────────────────────
export const DARK_THEME = {
  bg: '#0D0F14',
  surface: '#141720',
  surfaceHover: '#1C2030',
  border: '#252A3A',
  accent: '#4F8EF7',
  accentDim: '#2A3F6F',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#A78BFA',
  text: '#E2E8F0',
  textMuted: '#64748B',
  textDim: '#94A3B8',
  inputBg: '#0D0F14',
  shadow: 'rgba(0,0,0,0.5)',
  cardShadow: '0 8px 32px rgba(0,0,0,0.3)',
}

export const LIGHT_THEME = {
  bg: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceHover: '#F8FAFC',
  border: '#E2E8F0',
  accent: '#3B82F6',
  accentDim: '#DBEAFE',
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
  purple: '#7C3AED',
  text: '#0F172A',
  textMuted: '#64748B',
  textDim: '#334155',
  inputBg: '#F8FAFC',
  shadow: 'rgba(0,0,0,0.08)',
  cardShadow: '0 4px 16px rgba(0,0,0,0.08)',
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
  comment_added: { label: 'Comment Added',     desc: 'When a comment is posted on a task' },
  file_added:    { label: 'File Attached',     desc: 'When a file is attached to a task' },
}
