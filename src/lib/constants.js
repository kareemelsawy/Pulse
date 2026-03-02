export const COLORS = {
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
}

export const PRIORITY = {
  high:   { label: 'High',   color: '#EF4444', icon: '↑↑' },
  medium: { label: 'Medium', color: '#F59E0B', icon: '↑'  },
  low:    { label: 'Low',    color: '#22C55E', icon: '↓'  },
}

export const STATUS = {
  todo:       { label: 'To Do',       color: '#475569' },
  inprogress: { label: 'In Progress', color: '#4F8EF7' },
  review:     { label: 'Review',      color: '#A78BFA' },
  done:       { label: 'Done',        color: '#22C55E' },
}

export const ALL_TAGS = [
  'Design', 'Frontend', 'Backend', 'Engineering',
  'Content', 'Marketing', 'Research', 'Strategy',
]

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
