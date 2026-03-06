# Pulse Architecture

> Paste this file at the start of a session so Claude can navigate without reading every file.

## Stack
React + Vite · Supabase (auth, DB, storage) · Inline styles (no CSS files) · No state manager

## Entry
`src/main.jsx` → `src/App.jsx` → route to `AppShell` or `GuestView` based on auth + workspace state

---

## Pages (`src/pages/`)
| File | What it does |
|---|---|
| `App.jsx` | Auth routing. Detects guest vs member vs no-workspace |
| `AppShell.jsx` | Sidebar nav + page switcher. Add new nav items here |
| `Pages.jsx` | OverviewPage, MyTasksPage, ProjectView, PipelineView + their local modals (EditProject, CsvImport, NewProject, NewPipeline). ~420 lines |
| `GlobalMeetingsPage.jsx` | Cross-project meetings hub. Loads all projects' meetings via Promise.all |
| `GuestView.jsx` | Read-only dashboard for @homzmart.com guests. No workspace access |
| `SettingsPage.jsx` | Workspace name, invite code, member management |
| `AnalyticsPage.jsx` | Charts and stats |
| `LoginPage.jsx` | Supabase auth UI |
| `WorkspaceSetup.jsx` | First-run: create or join workspace |

---

## Components (`src/components/`)
| File | What it does |
|---|---|
| `UI.jsx` | Shared primitives: Modal, Btn, Badge, Avatar, Icon, ProgressBar, lStyle, iStyle |
| `TaskModal.jsx` | Create/edit task modal. Has comments + attachments tabs |
| `TaskViews.jsx` | BoardView, ListView, PriorityIcon — the kanban and list renderers |
| `MeetingCard.jsx` | Single meeting card with expandable task list |
| `MeetingModal.jsx` | Create/edit meeting modal with inline task creation |
| `AttachmentsSection.jsx` | File upload/list section used inside TaskModal |
| `WorkspaceSettings.jsx` | Member list + invite code panel (used in SettingsPage) |
| `ErrorBoundary.jsx` | Top-level error boundary |

---

## DB (`src/lib/db/`)
Each file is independently importable. The barrel `index.js` re-exports all of them.

| File | Tables touched |
|---|---|
| `workspace.js` | workspaces, workspace_members, profiles |
| `projects.js` | projects |
| `tasks.js` | tasks, task_comments, task_attachments (also: exportTasksCsv util) |
| `meetings.js` | project_meetings |
| `notifications.js` | notif_settings, notif_logs |
| `guests.js` | guest_invitations |
| `index.js` | barrel re-export |

`src/lib/db.js` — legacy shim, just re-exports from `./db/index`

---

## Contexts (`src/contexts/`)
| File | Provides |
|---|---|
| `AuthContext.jsx` | `user`, `signOut` — wraps Supabase auth |
| `DataContext.jsx` | `projects`, `tasks`, `members`, `workspace` + mutations (addTask, editTask, etc.). Subscribes to realtime. |
| `ThemeContext.jsx` | `theme` toggle (dark/light) |

---

## Lib (`src/lib/`)
| File | Purpose |
|---|---|
| `constants.js` | COLORS, STATUS, PRIORITY, PROJECT_COLORS, STATUS_FLOW |
| `supabase.js` | Supabase client singleton |
| `gmail.js` | Gmail notification helpers |

---

## Guest System
- Trigger: `DataContext.addTask()` calls `logGuestInvitation()` when `assignee_email` ends with `@homzmart.com`
- Detection: `App.jsx` checks `wsError === 'no_workspace' && user.email.endsWith('@homzmart.com')` → routes to `GuestView`
- DB: `guest_invitations` table + RLS policies in `v8-migration.sql`
- Upgrade path: give workspace invite code → re-login → lands in normal AppShell

## Global Meetings Hub
- Nav item in `AppShell.jsx` (messageCircle icon)
- `GlobalMeetingsPage.jsx` loads meetings across all projects via `Promise.all(projects.map(p => getMeetings(p.id)))`
- Filter by project, search by title, grouped by month
- Uses `MeetingCard` and `MeetingModal` components

---

## Key Patterns
- **Modals**: always rendered inline at bottom of parent component, controlled by local state
- **Toasts**: `toast(message, type)` passed as prop down from AppShell
- **Realtime**: subscriptions set up in DataContext via Supabase channels
- **No router**: page switching is manual state in AppShell (`currentPage`, `selectedProject`)
