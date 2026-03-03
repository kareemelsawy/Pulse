import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useTheme } from '../contexts/ThemeContext'
import { COLORS } from '../lib/constants'
import { Avatar, Spinner, Icon } from '../components/UI'
import { OverviewPage, MyTasksPage, ProjectView, NewProjectModal, PipelineView, NewPipelineModal } from './Pages'
import DocsPage from './DocsPage'
import SettingsPage from './SettingsPage'
import AnalyticsPage from './AnalyticsPage'

export default function AppShell({ toast }) {
  const { user, signOut } = useAuth()
  const { workspace, projects, getProjectTasks, loading } = useData()
  const { isDark, toggleTheme, setAutoTheme } = useTheme()
  const [view, setView]                       = useState('overview')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [sidebarOpen, setSidebarOpen]         = useState(true)
  const [newProjectOpen, setNewProjectOpen]   = useState(false)
  const [newPipelineOpen, setNewPipelineOpen] = useState(false)
  const [userMenu, setUserMenu]               = useState(false)

  const activeProject = projects.find(p => p.id === activeProjectId) || null
  const activeProjects  = projects.filter(p => !p.is_pipeline)
  const pipelineProjects = projects.filter(p => p.is_pipeline)

  const displayName = user?.user_metadata?.full_name || user?.email || 'You'
  const avatarName  = user?.user_metadata?.full_name || user?.email || 'U'

  function openProject(p) { setActiveProjectId(p.id); setView('project') }
  function openOverview() { setActiveProjectId(null); setView('overview') }
  function openMyTasks()  { setActiveProjectId(null); setView('mytasks') }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: COLORS.accent, fontWeight: 900 }}>✦</div>
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
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#fff', fontWeight: 900, letterSpacing: '-2px' }}>✦</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.accent }}>Pulse</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '10px 8px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <NavItem icon={<Icon name="grid" size={15} />}    label="Overview"  active={view === 'overview'}  onClick={openOverview} />
            <NavItem icon={<Icon name="tasks" size={15} />}   label="My Tasks"  active={view === 'mytasks'}   onClick={openMyTasks} />
            <NavItem icon={<Icon name="barChart" size={15} />} label="Analytics" active={view === 'analytics'} onClick={() => { setActiveProjectId(null); setView('analytics') }} />
          </nav>

          {/* Scrollable middle — Projects + Pipeline */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

            {/* Active projects */}
            <div style={{ padding: '10px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projects</span>
                <button onClick={() => setNewProjectOpen(true)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>+</button>
              </div>
              {activeProjects.length === 0 && <div style={{ padding: '4px 10px 6px', fontSize: 12, color: COLORS.textMuted }}>No projects yet.</div>}
              {activeProjects.map(p => {
                const ptasks   = getProjectTasks(p.id)
                const done     = ptasks.filter(t => t.status === 'done').length
                const isActive = activeProjectId === p.id && view === 'project'
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

            {/* Pipeline section */}
            <div style={{ padding: '4px 8px 10px', borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pipeline</span>
                  {pipelineProjects.length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: COLORS.purple + '22', color: COLORS.purple, borderRadius: 10, padding: '1px 6px' }}>{pipelineProjects.length}</span>
                  )}
                </div>
                <button onClick={() => setNewPipelineOpen(true)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>+</button>
              </div>

              {/* Pipeline view nav item */}
              <div onClick={() => { setActiveProjectId(null); setView('pipeline') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: view === 'pipeline' ? COLORS.surfaceHover : 'transparent', color: view === 'pipeline' ? COLORS.text : COLORS.textDim, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = view === 'pipeline' ? COLORS.surfaceHover : 'transparent'}>
                <span style={{ fontSize: 14, lineHeight: 1, color: COLORS.purple }}>🔭</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>View All Pipeline</span>
                {pipelineProjects.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.textMuted }}>{pipelineProjects.length}</span>}
              </div>

              {/* Individual pipeline items */}
              {pipelineProjects.map(p => (
                <div key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'default', marginBottom: 1, opacity: 0.75 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px dashed ${p.color}`, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
              ))}

              {pipelineProjects.length === 0 && (
                <div style={{ padding: '2px 10px 4px', fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>No pipeline items yet.</div>
              )}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ padding: 8, borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <NavItem icon={<Icon name="settings" size={15} />} label="Settings" active={view === 'settings'} onClick={() => { setActiveProjectId(null); setView('settings') }} />
            <NavItem icon={<Icon name="fileText" size={15} />} label="Docs" active={view === 'docs'} onClick={() => { setActiveProjectId(null); setView('docs') }} />
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
                <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 6, marginBottom: 4, zIndex: 50, boxShadow: `0 8px 32px ${COLORS.shadow}` }}>
                  <button onClick={() => { setUserMenu(false); setView('settings') }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: COLORS.textDim, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>⚙ Settings</button>
                  <button onClick={() => { setUserMenu(false); signOut() }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: COLORS.red, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: 52, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 20, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}>☰</button>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <div style={{ marginLeft: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: 'none', border: 'none', padding: '5px 10px', cursor: 'pointer', color: COLORS.textDim, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
              {isDark ? <Icon name="sun" size={15} color={COLORS.textMuted} /> : <Icon name="moon" size={15} color={COLORS.textMuted} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim }}>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={setAutoTheme} title="Auto: dark 6 PM to 6 AM, light otherwise"
              style={{ background: 'none', border: 'none', borderLeft: `1px solid ${COLORS.border}`, padding: '5px 8px', cursor: 'pointer', fontSize: 11, color: COLORS.textMuted, fontFamily: 'inherit' }}>
              Auto
            </button>
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {view === 'overview'  && <OverviewPage onOpenProject={openProject} onNewProject={() => setNewProjectOpen(true)} workspaceName={workspace?.name} />}
          {view === 'mytasks'   && <MyTasksPage />}
          {view === 'analytics' && <AnalyticsPage />}
          {view === 'project'   && activeProject && <ProjectView key={activeProject.id} project={activeProject} toast={toast} />}
          {view === 'settings'  && <SettingsPage toast={toast} />}
          {view === 'pipeline'  && <PipelineView onConvertToProject={() => setView('overview')} toast={toast} />}
          {view === 'docs'      && <DocsPage />}
        </main>
      </div>

      {newProjectOpen  && <NewProjectModal  onClose={() => setNewProjectOpen(false)}  toast={toast} />}
      {newPipelineOpen && <NewPipelineModal onClose={() => setNewPipelineOpen(false)} toast={toast} />}
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: active ? COLORS.surfaceHover : 'transparent', color: active ? COLORS.text : COLORS.textDim, marginBottom: 1, transition: 'all 0.15s' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.surfaceHover }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: 500, fontSize: 13 }}>{label}</span>
    </div>
  )
}
