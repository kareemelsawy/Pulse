// ─── Theme tokens — inspired by the reference UI ──────────────────────────────
// Reference: dark icon rail + light content panel + neutral typography
export const DARK_THEME = {
  // Base
  bg:           '#0F0F12',
  bgSecondary:  '#161619',
  bgTertiary:   '#1C1C21',
  // Surfaces
  surface:      '#1E1E24',
  surfaceHover: '#26262E',
  surfaceRaised:'#2A2A33',
  surfaceModal: 'rgba(15,15,18,0.96)',
  // Borders — very subtle
  border:       'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  // Accent — keep the blue beam
  accent:    '#4F8EF7',
  accentDim: 'rgba(79,142,247,0.14)',
  accentText:'#7EB3FF',
  // Semantics
  green:     '#22C55E',
  greenDim:  'rgba(34,197,94,0.14)',
  amber:     '#F59E0B',
  amberDim:  'rgba(245,158,11,0.14)',
  red:       '#EF4444',
  redDim:    'rgba(239,68,68,0.14)',
  purple:    '#A78BFA',
  blue:      '#60A5FA',
  // Text hierarchy — 4 levels
  text:      '#F1F1F3',
  textDim:   '#A1A1AA',
  textMuted: '#52525B',
  textFaint: '#3F3F46',
  // Inputs
  inputBg:   '#1A1A20',
  inputBorder:'rgba(255,255,255,0.09)',
  // Shadows
  shadow:      'rgba(0,0,0,0.7)',
  cardShadow:  '0 1px 3px rgba(0,0,0,0.4)',
  modalShadow: '0 24px 80px rgba(0,0,0,0.8)',
  // Sidebar rails
  rail:        '#0F0F12',
  railText:    '#71717A',
  railActive:  '#F1F1F3',
}

export const LIGHT_THEME = {
  bg:           '#F4F4F5',
  bgSecondary:  '#FAFAFA',
  bgTertiary:   '#FFFFFF',
  surface:      '#FFFFFF',
  surfaceHover: '#F4F4F5',
  surfaceRaised:'#FFFFFF',
  surfaceModal: 'rgba(255,255,255,0.98)',
  border:       'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.16)',
  accent:    '#2563EB',
  accentDim: 'rgba(37,99,235,0.10)',
  accentText:'#1D4ED8',
  green:     '#16A34A',
  greenDim:  'rgba(22,163,74,0.10)',
  amber:     '#D97706',
  amberDim:  'rgba(217,119,6,0.10)',
  red:       '#DC2626',
  redDim:    'rgba(220,38,38,0.10)',
  purple:    '#7C3AED',
  blue:      '#2563EB',
  text:      '#09090B',
  textDim:   '#3F3F46',
  textMuted: '#71717A',
  textFaint: '#A1A1AA',
  inputBg:   '#FFFFFF',
  inputBorder:'rgba(0,0,0,0.12)',
  shadow:      'rgba(0,0,0,0.08)',
  cardShadow:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  modalShadow: '0 20px 60px rgba(0,0,0,0.14)',
  rail:        '#18181B',
  railText:    '#71717A',
  railActive:  '#F9F9F9',
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
  new:        { label: 'New',         color: '#71717A', next: 'inprogress' },
  inprogress: { label: 'In Progress', color: '#3B82F6', next: 'review'     },
  review:     { label: 'Review',      color: '#8B5CF6', next: 'done'       },
  done:       { label: 'Done',        color: '#22C55E', next: null         },
}

export const STATUS_FLOW = ['new', 'inprogress', 'review', 'done']

export const PROJECT_COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
]

export const NOTIFICATION_TRIGGERS = {
  task_assigned: { label: 'Task Assigned',    desc: 'When a task is assigned to a member' },
  status_changed:{ label: 'Status Changed',   desc: 'When a task status changes' },
  task_completed:{ label: 'Task Completed',   desc: 'When a task is marked done' },
  new_task:      { label: 'New Task Created', desc: 'When a new task is added' },
  comment_added: { label: 'Comment Added',    desc: 'When a comment is posted on a task' },
  file_added:    { label: 'File Attached',    desc: 'When a file is attached to a task' },
}
