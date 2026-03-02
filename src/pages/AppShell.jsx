import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { COLORS } from '../lib/constants'
import { Avatar, Spinner } from '../components/UI'
import WorkspaceSettings from '../components/WorkspaceSettings'
import { OverviewPage, MyTasksPage, ProjectView, NewProjectModal, NotifModal } from './Pages'

export default function AppShell({ toast }) {
  const { user, signOut } = useAuth()
  const { workspace, projects, getProjectTasks, loading } = useData()
  const [view, setView]                   = useState('overview')
  const [activeProject, setActiveProject] = useState(null)
  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [notifOpen, setNotifOpen]         = useState(false)
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false)
  const [userMenu, setUserMenu]           = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email || 'You'
  const avatarName  = user?.user_metadata?.full_name || user?.email || 'U'

  function openProject(p) { setActiveProject(p); setView('project') }
  function openOverview() { setActiveProject(null); setView('overview') }
  function openMyTasks()  { setActiveProject(null); setView('mytasks') }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 16 }}>
      <div style={{ fontSize: 36 }}>◈</div>
      <Spinner size={28} />
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.bg, color: COLORS.text, overflow: 'hidden' }}>

      {sidebarOpen && (
        <aside style={{ width: 240, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>

          {/* Workspace header */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>◈</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace?.name || 'Pulse'}</div>
              </div>
              <button onClick={() => setWsSettingsOpen(true)} title="Workspace Settings" style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 15, padding: '2px 4px', borderRadius: 6, flexShrink: 0 }}>⚙</button>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '10px 8px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <NavItem icon="⊞" label="Overview" active={view === 'overview'} onClick={openOverview} />
            <NavItem icon="✦" label="My Tasks" active={view === 'mytasks'} onClick={openMyTasks} />
          </nav>

          {/* Projects */}
          <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projects</span>
              <button onClick={() => setNewProjectOpen(true)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>+</button>
            </div>
            {projects.length === 0 && <div style={{ padding: '8px 10px', fontSize: 12, color: COLORS.textMuted }}>No projects yet.</div>}
            {projects.map(p => {
              const ptasks   = getProjectTasks(p.id)
              const done     = ptasks.filter(t => t.status === 'done').length
              const isActive = activeProject?.id === p.id && view === 'project'
              return (
                <div key={p.id} onClick={() => openProject(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 1, background: isActive ? COLORS.surfaceHover : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? COLORS.surfaceHover : 'transparent'}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{done}/{ptasks.length}</span>
                </div>
              )
            })}
          </div>

          {/* Bottom */}
          <div style={{ padding: 8, borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <NavItem icon="✉" label="Email Notifications" active={false} onClick={() => setNotifOpen(true)} />
            <div style={{ position: 'relative' }}>
              <div onClick={() => setUserMenu(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <Avatar name={avatarName} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </div>
              {userMenu && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 6, marginBottom: 4, zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  <button onClick={() => { setUserMenu(false); setWsSettingsOpen(true) }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: COLORS.textDim, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>⚙ Workspace Settings</button>
                  <button onClick={() => { setUserMenu(false); signOut() }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: COLORS.red, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: 52, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 20, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}>☰</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </header>
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {view === 'overview' && <OverviewPage onOpenProject={openProject} onNewProject={() => setNewProjectOpen(true)} />}
          {view === 'mytasks'  && <MyTasksPage />}
          {view === 'project'  && activeProject && <ProjectView key={activeProject.id} project={activeProject} toast={toast} />}
        </main>
      </div>

      {newProjectOpen  && <NewProjectModal      onClose={() => setNewProjectOpen(false)}  toast={toast} />}
      {notifOpen       && <NotifModal           onClose={() => setNotifOpen(false)}        toast={toast} />}
      {wsSettingsOpen  && <WorkspaceSettings    onClose={() => setWsSettingsOpen(false)}   toast={toast} />}
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: active ? COLORS.surfaceHover : 'transparent', color: active ? COLORS.text : COLORS.textDim, marginBottom: 1, transition: 'all 0.15s' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.surfaceHover }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: 500, fontSize: 13 }}>{label}</span>
    </div>
  )
}
