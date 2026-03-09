// ─── Theme system ─────────────────────────────────────────────────────────────
export const DARK_THEME = {
  // Transparent glass surfaces — rendered over gradient
  bg:           'transparent',
  surface:      'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',
  surfaceModal: 'rgba(15,12,40,0.75)',
  border:       'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.22)',
  // Accents
  accent:    '#6B8EF7',
  accentDim: 'rgba(107,142,247,0.18)',
  green:     '#34D17A',
  amber:     '#FBBF24',
  red:       '#F87171',
  purple:    '#C084FC',
  blue:      '#60A5FA',
  // Text — high contrast over dark gradient
  text:      '#F0F4FF',
  textMuted: 'rgba(200,210,240,0.45)',
  textDim:   'rgba(200,210,240,0.75)',
  // Inputs
  inputBg:   'rgba(255,255,255,0.07)',
  // Shadows
  shadow:      'rgba(0,0,0,0.6)',
  cardShadow:  '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
  modalShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
}

export const LIGHT_THEME = {
  bg:           'transparent',
  // Strong white surfaces so glass is readable against blue gradient
  surface:      'rgba(255,255,255,0.88)',
  surfaceHover: 'rgba(255,255,255,0.95)',
  surfaceModal: 'rgba(255,255,255,0.96)',
  border:       'rgba(10,30,80,0.16)',
  borderStrong: 'rgba(10,30,80,0.28)',
  accent:    '#1A56FF',
  accentDim: 'rgba(26,86,255,0.10)',
  green:     '#15803D',
  amber:     '#B45309',
  red:       '#B91C1C',
  purple:    '#6D28D9',
  blue:      '#1A56FF',
  // High-contrast text — near-black for WCAG AA compliance
  text:      '#0A0F1E',
  textMuted: '#5A6478',
  textDim:   '#2D3550',
  // Inputs: solid white so text is clearly readable
  inputBg:   'rgba(255,255,255,0.92)',
  shadow:      'rgba(10,20,60,0.12)',
  cardShadow:  '0 2px 16px rgba(10,20,60,0.10), inset 0 1px 0 rgba(255,255,255,1)',
  modalShadow: '0 20px 60px rgba(10,20,60,0.16), inset 0 1px 0 rgba(255,255,255,1)',
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
  due_soon:      { label: 'Due Tomorrow',      desc: 'Sent 1 day before a task is due' },
}
