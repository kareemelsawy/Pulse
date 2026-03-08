// ─── Theme system ─────────────────────────────────────────────────────────────
// ── Apple HIG color system ───────────────────────────────────────
// Light: iOS/macOS default light mode palette
// Dark:  macOS dark mode palette
export const LIGHT_THEME = {
  // Backgrounds — layered like macOS
  bg:           '#F2F2F7',   // systemGroupedBackground
  surface:      '#FFFFFF',   // secondarySystemGroupedBackground
  surfaceHover: '#F2F2F7',   // tertiarySystemGroupedBackground
  surfaceModal: 'rgba(255,255,255,0.85)',

  // Borders
  border:       'rgba(60,60,67,0.12)',
  borderStrong: 'rgba(60,60,67,0.22)',

  // Apple system accent — iOS Blue
  accent:       '#007AFF',
  accentDim:    'rgba(0,122,255,0.12)',
  accentHover:  '#0071F0',

  // Semantic colors — Apple spec
  green:        '#34C759',   // systemGreen
  amber:        '#FF9500',   // systemOrange
  red:          '#FF3B30',   // systemRed
  purple:       '#AF52DE',   // systemPurple
  blue:         '#007AFF',   // systemBlue
  teal:         '#5AC8FA',   // systemTeal
  indigo:       '#5856D6',   // systemIndigo

  // Typography
  text:         '#000000',   // label
  textDim:      '#3C3C43',   // secondaryLabel (60% opacity approx)
  textMuted:    'rgba(60,60,67,0.40)', // tertiaryLabel
  textPlaceholder: 'rgba(60,60,67,0.30)',

  // Inputs
  inputBg:      '#FFFFFF',
  inputBorder:  'rgba(60,60,67,0.18)',

  // Shadows — Apple uses soft multi-layer
  shadow:       'rgba(0,0,0,0.08)',
  cardShadow:   '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
  modalShadow:  '0 8px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
}

export const DARK_THEME = {
  // Backgrounds
  bg:           '#000000',   // systemBackground dark
  surface:      '#1C1C1E',   // secondarySystemBackground dark
  surfaceHover: '#2C2C2E',   // tertiarySystemBackground dark
  surfaceModal: 'rgba(28,28,30,0.92)',

  // Borders
  border:       'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // Accent
  accent:       '#0A84FF',   // systemBlue dark
  accentDim:    'rgba(10,132,255,0.18)',
  accentHover:  '#1A8FFF',

  // Semantic
  green:        '#30D158',
  amber:        '#FF9F0A',
  red:          '#FF453A',
  purple:       '#BF5AF2',
  blue:         '#0A84FF',
  teal:         '#5AC8FA',
  indigo:       '#5E5CE6',

  // Typography
  text:         '#FFFFFF',
  textDim:      'rgba(255,255,255,0.75)',
  textMuted:    'rgba(255,255,255,0.40)',
  textPlaceholder: 'rgba(255,255,255,0.25)',

  // Inputs
  inputBg:      '#1C1C1E',
  inputBorder:  'rgba(255,255,255,0.12)',

  // Shadows
  shadow:       'rgba(0,0,0,0.5)',
  cardShadow:   '0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
  modalShadow:  '0 16px 64px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
}

export let COLORS = { ...DARK_THEME }
export function setThemeColors(isDark) {
  const t = isDark ? DARK_THEME : LIGHT_THEME
  Object.keys(t).forEach(k => { COLORS[k] = t[k] })
}

export const PRIORITY = {
  high:   { label: 'High',   color: '#FF3B30', icon: '↑↑' },
  medium: { label: 'Medium', color: '#FF9500', icon: '↑'  },
  low:    { label: 'Low',    color: '#34C759', icon: '↓'  },
}

export const STATUS = {
  new:        { label: 'New',         color: '#8E8E93', next: 'inprogress' },
  inprogress: { label: 'In Progress', color: '#007AFF', next: 'review'     },
  review:     { label: 'Review',      color: '#AF52DE', next: 'done'       },
  done:       { label: 'Done',        color: '#34C759', next: null         },
}

export const STATUS_FLOW = ['new', 'inprogress', 'review', 'done']

export const PROJECT_COLORS = [
  '#007AFF', '#AF52DE', '#34C759', '#FF9500',
  '#FF3B30', '#FF2D55', '#5AC8FA', '#5856D6',
]

export const NOTIFICATION_TRIGGERS = {
  task_assigned: { label: 'Task Assigned',     desc: 'When a task is assigned to a member' },
  status_changed:{ label: 'Status Changed',    desc: 'When a task status changes' },
  task_completed:{ label: 'Task Completed',    desc: 'When a task is marked done' },
  new_task:      { label: 'New Task Created',  desc: 'When a new task is added' },
}
