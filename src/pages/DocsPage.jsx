import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { COLORS } from '../lib/constants'

const DOCS = [
  {
    id: 'overview',
    icon: '◉',
    title: 'Overview',
    summary: 'Your workspace home — status summary, overdue alerts, all projects at a glance.',
    sections: [
      {
        heading: 'What you see',
        body: 'The Overview page loads when you sign in. It shows four stat cards (New, In Progress, Review, Done) counted across every task in your workspace, a red alert banner if any tasks are overdue, and a card grid of all active projects.',
      },
      {
        heading: 'Project cards',
        body: 'Each card shows the project name, description, a progress bar (% done), and an overdue count if applicable. Click any card to open that project. The "+ New Project" button top-right creates a fresh project.',
      },
    ],
  },
  {
    id: 'projects',
    icon: '▣',
    title: 'Projects',
    summary: 'Organise work into projects with board and list views, filters, and CSV import/export.',
    sections: [
      {
        heading: 'Board vs List',
        body: 'Switch between views using the icons in the project header. Board groups tasks by status column — drag-friendly for visual tracking. List is a compact table with sortable columns for when you have many tasks.',
      },
      {
        heading: 'Task status flow',
        body: 'Tasks follow a fixed flow: New → In Progress → Review → Done. Members can only move a task to the next step. Admins (workspace owners) can jump to any status. Each board column has a quick "→ Next Step" button to advance without opening the task.',
      },
      {
        heading: 'Filtering & search',
        body: 'Use the Status filter dropdown to show only tasks in a given state. The search box (top-right of the header) filters by task title in real time. Both filters stack — e.g. "In Progress" + "homepage" narrows to matching tasks.',
      },
      {
        heading: 'Import CSV',
        body: 'Click "↑ Import" to bulk-create tasks from a spreadsheet. Download the template first (link inside the modal) to see the exact column format: title, status, priority, assignee_name, assignee_email, due_date. The preview shows the first 10 rows before you commit.',
      },
      {
        heading: 'Export CSV',
        body: '"↓ Export" downloads the currently filtered tasks as a .csv file named after the project. Use this to hand off a task list, build a report, or prepare a file for the Edit via CSV workflow.',
      },
      {
        heading: 'Edit via CSV',
        body: '"✎ Edit via CSV" (removed in latest version — use Export then Import) lets you download the current task list, edit it in Excel or Sheets, then re-upload to override. Useful for bulk re-assignments or due-date updates.',
      },
      {
        heading: 'Editing a project',
        body: 'Click the pencil icon next to the project name to rename, update the description, or change the colour. Owners can also delete the project from this modal — all tasks are permanently removed.',
      },
    ],
  },
  {
    id: 'tasks',
    icon: '✓',
    title: 'Tasks',
    summary: 'Create, assign, prioritise and track individual units of work with comments and attachments.',
    sections: [
      {
        heading: 'Creating a task',
        body: 'Click "+ Add Task" in any project. Enter a title, pick a priority (High / Medium / Low), set an optional due date, and assign to a workspace member. New tasks always start with status "New".',
      },
      {
        heading: 'Priority',
        body: 'Three levels — High (red), Medium (amber), Low (green). Priority is shown as a coloured icon on board cards and a coloured label in list view. It affects nothing automatically; it\'s a signal for the team.',
      },
      {
        heading: 'Assignee',
        body: 'Pick from workspace members using the pill-button selector. Selecting "Unassigned" clears the field. The assigned person\'s name appears on the task card and in their "My Tasks" view.',
      },
      {
        heading: 'Due dates',
        body: 'Tasks with a due date in the past (and not Done) are highlighted in red in list view. Overdue counts surface on the project card on Overview and in the red banner at the top of Overview.',
      },
      {
        heading: 'Comments',
        body: 'Open any existing task to see the comments thread. Type in the box and click Post (or ⌘+Enter) to add a comment. You can delete your own comments; admins can delete anyone\'s. Comments are not available on unsaved (new) tasks.',
      },
      {
        heading: 'Attachments',
        body: 'Click "Attach file" inside a task to upload a file (images, PDFs, docs, spreadsheets, zips up to 20 MB). Files are stored in Supabase Storage. Click the filename to open/download. The × button deletes the file permanently.',
      },
    ],
  },
  {
    id: 'mytasks',
    icon: '☑',
    title: 'My Tasks',
    summary: 'A personal view of every task assigned to you, sorted by due date.',
    sections: [
      {
        heading: 'What appears here',
        body: 'All tasks assigned to your account across every project, excluding tasks with status "Done". Sorted by due date — earliest first, undated tasks at the bottom.',
      },
      {
        heading: 'Overdue section',
        body: 'Tasks past their due date appear in a red "Overdue" section at the top. Upcoming tasks appear below. This gives you a quick daily triage view without opening each project.',
      },
    ],
  },
  {
    id: 'meetings',
    icon: '◎',
    title: 'Meetings',
    summary: 'Log meeting minutes and create linked tasks that appear directly on the project board.',
    sections: [
      {
        heading: 'Accessing meetings',
        body: 'Open any project, then click the "Meetings" tab in the project header (next to "Tasks"). Each project has its own meeting log.',
      },
      {
        heading: 'Creating a meeting',
        body: 'Click "+ New Meeting". Fill in the title, date, attendees (free text, comma-separated), and meeting notes/minutes. The notes field is freeform — paste in decisions, context, anything relevant.',
      },
      {
        heading: 'Tasks from meetings',
        body: 'The Tasks section in the meeting modal is where action items become real tasks. Each row has: task title, due date, priority, and assignee. For workspace members use the dropdown; click "External?" to switch to a freeform name field for guests from other teams. All tasks created here start as "New" and appear immediately on the project board.',
      },
      {
        heading: 'Viewing linked tasks',
        body: 'On the meeting card click "▼ Tasks" to expand. You see every task linked to that meeting with its live status, assignee, due date, status badge and priority. If someone marks a task done on the board it updates here automatically.',
      },
      {
        heading: 'Editing a meeting',
        body: 'Click the pencil icon on any meeting card. You can update all fields and add more tasks. Existing tasks are shown read-only in edit mode — edit them directly on the board.',
      },
      {
        heading: 'Deleting a meeting',
        body: 'Click × on the meeting card then confirm. The meeting record is removed but all tasks created from it stay alive in the project — they just lose the meeting link.',
      },
    ],
  },
  {
    id: 'pipeline',
    icon: '🔭',
    title: 'Pipeline',
    summary: 'A lightweight backlog for project ideas you want to track but haven\'t kicked off yet.',
    sections: [
      {
        heading: 'What the pipeline is for',
        body: 'The pipeline holds project placeholders — no tasks, no board, no deadlines. Use it to capture ideas, client requests, or initiatives you\'ve scoped but not started. It keeps them visible without cluttering your active project list.',
      },
      {
        heading: 'Adding to the pipeline',
        body: 'Click "+" next to the Pipeline label in the sidebar, or "+ Add to Pipeline" on the Pipeline page. Give it a name, optional description, and a colour. That\'s it.',
      },
      {
        heading: 'Converting to a project',
        body: 'When you\'re ready to start work, open the Pipeline page and click "Convert to Project" on the card. The item moves to your active Projects list and you can start adding tasks immediately. Nothing else changes — the name, description, and colour carry over.',
      },
      {
        heading: 'Pipeline in the sidebar',
        body: 'Pipeline items appear as dashed dots under the Pipeline section — visually distinct from active projects (solid dots). The count badge on the Pipeline label shows how many items are waiting.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: '▲',
    title: 'Analytics',
    summary: 'Workspace-wide charts: task completion, status breakdown, team workload, and overdue trends.',
    sections: [
      {
        heading: 'What\'s tracked',
        body: 'Analytics pulls from every task in the workspace. Charts include: tasks by status (donut), tasks per project (bar), tasks per assignee (workload), and overdue tasks per project. All data is live — no delay.',
      },
      {
        heading: 'Filtering',
        body: 'Use the project and date filters at the top to scope the charts. You can narrow to a single project or a specific date range to see velocity over a sprint or quarter.',
      },
    ],
  },
  {
    id: 'workspace',
    icon: '⬡',
    title: 'Workspace & Members',
    summary: 'Invite teammates, manage roles, and configure your workspace name and invite code.',
    sections: [
      {
        heading: 'Invite code',
        body: 'Found in Settings → Workspace. Share the 8-character code (or the full invite link) with anyone you want to add. They sign in (email or Google) then enter the code on the workspace setup screen.',
      },
      {
        heading: 'Roles',
        body: 'Two roles: Owner and Member. Owners can delete projects, delete any task, remove members, update the workspace name, and regenerate the invite code. Members can create and edit tasks but can only move status forward (not jump to any status).',
      },
      {
        heading: 'Removing a member',
        body: 'Settings → Workspace → Members → Remove. Their account is not deleted — they just lose access to this workspace. Their tasks remain assigned to them by name.',
      },
      {
        heading: 'Regenerating the invite code',
        body: 'Click "↺ New" in the Invite Code card. The old code stops working immediately. Useful if the code was shared too widely.',
      },
    ],
  },
  {
    id: 'notifications',
    icon: '◈',
    title: 'Notifications',
    summary: 'Email alerts via Gmail when tasks are assigned, status changes, or tasks are completed.',
    sections: [
      {
        heading: 'Setup',
        body: 'Settings → Notifications. You need a Google OAuth Client ID from Google Cloud Console. Enter the Client ID, click "Sign in with Google", and authorise. The connected Gmail address is shown once linked.',
      },
      {
        heading: 'Triggers',
        body: 'Four triggers you can toggle independently: Task Assigned, Status Changed, Task Completed, New Task Created. All default on except "New Task Created" (too noisy for most teams).',
      },
      {
        heading: 'Recipients',
        body: '"Notify task assignee" sends to whoever is assigned the task. "Additional Emails" is a comma-separated list of addresses that always get notified regardless of assignment — useful for PMs or stakeholders who want visibility on everything.',
      },
    ],
  },
  {
    id: 'settings',
    icon: '⚙',
    title: 'Settings',
    summary: 'Account profile, password, login methods, workspace config, notifications, and Google Sign-In setup.',
    sections: [
      {
        heading: 'Account tab',
        body: 'Update your display name, change your email address (sends a confirmation link), or change your password. The Login Methods section shows connected providers — you can connect Google here as an additional sign-in method.',
      },
      {
        heading: 'Workspace tab',
        body: 'Rename the workspace (owners only), copy or regenerate the invite code, view and manage all members.',
      },
      {
        heading: 'Notifications tab',
        body: 'Connect Gmail for email alerts. Configure which events trigger emails and who receives them. See the Notifications section above for full details.',
      },
      {
        heading: 'Integrations tab',
        body: 'Step-by-step guide for setting up Google Sign-In. Includes a reference field to save your Google OAuth Client ID and Client Secret locally (browser only — never sent to any server). Has a "Test Connection" button to verify Google OAuth is reachable from Supabase.',
      },
    ],
  },
  {
    id: 'theme',
    icon: '◑',
    title: 'Theme',
    summary: 'Light and dark mode with automatic switching at 6 PM and 6 AM.',
    sections: [
      {
        heading: 'Manual toggle',
        body: 'The Light / Dark button in the top-right header switches themes instantly. Your choice is remembered across sessions.',
      },
      {
        heading: 'Auto mode',
        body: 'Click "Auto" next to the toggle to clear your manual override. In auto mode the app switches to dark at 6 PM and back to light at 6 AM, matching typical working hours. The switch happens automatically — no refresh needed.',
      },
    ],
  },
]

export default function DocsPage() {
  const { colors: C } = useTheme()
  const [activeId, setActiveId] = useState('overview')
  const active = DOCS.find(d => d.id === activeId) || DOCS[0]

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>

      {/* Left nav */}
      <div style={{ width: 200, borderRight: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Documentation</div>
        </div>
        {DOCS.map(d => (
          <button key={d.id} onClick={() => setActiveId(d.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
              background: activeId === d.id ? C.surfaceHover : 'none',
              border: 'none', borderLeft: `3px solid ${activeId === d.id ? C.accent : 'transparent'}`,
              color: activeId === d.id ? C.text : C.textDim,
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              fontSize: 13, fontWeight: activeId === d.id ? 600 : 400,
              transition: 'all 0.12s', width: '100%',
            }}
            onMouseEnter={e => { if (activeId !== d.id) e.currentTarget.style.background = C.surfaceHover }}
            onMouseLeave={e => { if (activeId !== d.id) e.currentTarget.style.background = 'none' }}>
            <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{d.icon}</span>
            {d.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        <div style={{ maxWidth: 700 }}>

          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accent + '18', border: `1px solid ${C.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {active.icon}
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>{active.title}</h1>
              <p style={{ color: C.textMuted, fontSize: 13, margin: '4px 0 0', lineHeight: 1.5 }}>{active.summary}</p>
            </div>
          </div>

          <div style={{ height: 1, background: C.border, margin: '24px 0' }} />

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {active.sections.map((s, i) => (
              <div key={i}>
                <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: C.text, letterSpacing: '-0.01em' }}>{s.heading}</h3>
                <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.8, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            {(() => {
              const idx = DOCS.findIndex(d => d.id === activeId)
              const prev = DOCS[idx - 1]
              const next = DOCS[idx + 1]
              return (
                <>
                  {prev ? (
                    <button onClick={() => setActiveId(prev.id)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: C.textDim, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ← {prev.title}
                    </button>
                  ) : <span />}
                  {next ? (
                    <button onClick={() => setActiveId(next.id)} style={{ background: C.accent + '18', border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: C.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {next.title} →
                    </button>
                  ) : <span />}
                </>
              )
            })()}
          </div>

        </div>
      </div>
    </div>
  )
}
