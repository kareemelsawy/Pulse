import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useTheme } from '../contexts/ThemeContext'
import { COLORS } from '../lib/constants'
import { Avatar, Spinner, Icon } from '../components/UI'
import { OverviewPage, ProjectView, NewProjectModal, PipelineView, NewPipelineModal } from './Pages'
import DocsPage from './DocsPage'
import GlobalMeetingsPage from './GlobalMeetingsPage'
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

  const activeProject    = projects.find(p => p.id === activeProjectId) || null
  const activeProjects   = projects.filter(p => !p.is_pipeline)
  const pipelineProjects = projects.filter(p => p.is_pipeline)
  const displayName      = user?.user_metadata?.full_name || user?.email || 'You'
  const isOwner          = workspace?.owner_id === user?.id

  function openProject(p) { setActiveProjectId(p.id); setView('project') }
  function openOverview()  { setActiveProjectId(null); setView('overview') }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="zap" size={14} color={COLORS.textDim} />
      </div>
      <Spinner size={18} />
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.bg, color: COLORS.text, overflow: 'hidden', fontFamily: "'Geist', sans-serif" }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{ width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>

          {/* Workspace header */}
          <div style={{ padding: '12px 12px 10px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.surfaceHover, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="zap" size={13} color={COLORS.textDim} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.text }}>{workspace?.name || 'Pulse'}</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
            <NavItem icon="grid"          label="Overview"   active={view === 'overview'}   onClick={openOverview} />
            {isOwner && <NavItem icon="barChart" label="Analytics" active={view === 'analytics'} onClick={() => { setActiveProjectId(null); setView('analytics') }} />}
            <NavItem icon="messageCircle" label="Meetings"   active={view === 'meetings'}   onClick={() => { setActiveProjectId(null); setView('meetings') }} />
          </nav>

          <div style={{ height: 1, background: COLORS.border, margin: '2px 8px' }} />

          {/* Projects */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '6px 8px' }}>
            <SidebarSection
              label="Projects"
              onAdd={() => setNewProjectOpen(true)}
            >
              {activeProjects.length === 0 && (
                <div style={{ padding: '4px 8px', fontSize: 12, color: COLORS.textMuted }}>No projects yet</div>
              )}
              {activeProjects.map(p => {
                const ptasks   = getProjectTasks(p.id)
                const done     = ptasks.filter(t => t.status === 'done').length
                const isActive = activeProjectId === p.id && view === 'project'
                return (
                  <ProjectItem
                    key={p.id}
                    project={p}
                    done={done}
                    total={ptasks.length}
                    active={isActive}
                    onClick={() => openProject(p)}
                  />
                )
              })}
            </SidebarSection>

            <div style={{ height: 1, background: COLORS.border, margin: '6px 0' }} />

            <SidebarSection
              label="Pipeline"
              count={pipelineProjects.length}
              onAdd={() => setNewPipelineOpen(true)}
            >
              <NavItem
                icon="inbox"
                label="All Pipeline"
                active={view === 'pipeline'}
                onClick={() => { setActiveProjectId(null); setView('pipeline') }}
                meta={pipelineProjects.length > 0 ? String(pipelineProjects.length) : null}
              />
              {pipelineProjects.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, opacity: 0.6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${p.color}`, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
              ))}
            </SidebarSection>
          </div>

          {/* Bottom */}
          <div style={{ padding: '6px 8px 8px', borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <NavItem icon="settings"  label="Settings" active={view === 'settings'} onClick={() => { setActiveProjectId(null); setView('settings') }} />
            <NavItem icon="fileText"  label="Docs"     active={view === 'docs'}     onClick={() => { setActiveProjectId(null); setView('docs') }} />

            {/* User row */}
            <div style={{ position: 'relative', marginTop: 2 }}>
              <div
                onClick={() => setUserMenu(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <Avatar name={displayName} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.textDim }}>{displayName}</div>
                </div>
                <Icon name={userMenu ? 'chevronDown' : 'chevronRight'} size={12} color={COLORS.textMuted} />
              </div>
              {userMenu && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: 4, marginBottom: 4, zIndex: 50, boxShadow: COLORS.cardShadow }}>
                  <MenuBtn onClick={() => { setUserMenu(false); setView('settings') }}>Settings</MenuBtn>
                  <div style={{ height: 1, background: COLORS.border, margin: '3px 0' }} />
                  <MenuBtn onClick={() => { setUserMenu(false); signOut() }} danger>Sign out</MenuBtn>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: 44, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '4px 6px', borderRadius: 5, display: 'flex', alignItems: 'center' }}
          >
            <Icon name="list" size={15} color={COLORS.textMuted} />
          </button>
          <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'Geist Mono', monospace" }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <div style={{ marginLeft: 'auto' }} />
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: COLORS.surfaceHover, border: `1px solid ${COLORS.border}`, borderRadius: 7, overflow: 'hidden', padding: 2 }}>
            <ThemeBtn active={isDark} onClick={toggleTheme} icon={isDark ? 'moon' : 'sun'} label={isDark ? 'Dark' : 'Light'} />
            <ThemeBtn onClick={setAutoTheme} label="Auto" />
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {view === 'overview'  && <OverviewPage onOpenProject={openProject} onNewProject={() => setNewProjectOpen(true)} workspaceName={workspace?.name} />}
          {view === 'analytics' && isOwner && <AnalyticsPage />}
          {view === 'project'   && activeProject && <ProjectView key={activeProject.id} project={activeProject} toast={toast} />}
          {view === 'settings'  && <SettingsPage toast={toast} />}
          {view === 'pipeline'  && <PipelineView onConvertToProject={() => setView('overview')} toast={toast} />}
          {view === 'meetings'  && <GlobalMeetingsPage toast={toast} />}
          {view === 'docs'      && <DocsPage />}
        </main>
      </div>

      {newProjectOpen  && <NewProjectModal  onClose={() => setNewProjectOpen(false)}  toast={toast} />}
      {newPipelineOpen && <NewPipelineModal onClose={() => setNewPipelineOpen(false)} toast={toast} />}
    </div>
  )
}

function NavItem({ icon, label, active, onClick, meta }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', background: active ? COLORS.surfaceHover : 'transparent', color: active ? COLORS.text : COLORS.textMuted, marginBottom: 1, transition: 'all 0.1s', userSelect: 'none' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.surfaceHover; e.currentTarget.style.color = COLORS.textDim }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted } }}
    >
      <Icon name={icon} size={14} color="currentColor" />
      <span style={{ fontWeight: active ? 500 : 400, fontSize: 13, flex: 1, letterSpacing: '-0.01em' }}>{label}</span>
      {meta && <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'Geist Mono', monospace" }}>{meta}</span>}
    </div>
  )
}

function SidebarSection({ label, count, onAdd, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 3px' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}{count > 0 ? ` · ${count}` : ''}
        </span>
        <button
          onClick={onAdd}
          style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', display: 'flex', padding: 2, borderRadius: 4, lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = COLORS.textDim}
          onMouseLeave={e => e.currentTarget.style.color = COLORS.textMuted}
        >
          <Icon name="plus" size={13} color="currentColor" />
        </button>
      </div>
      {children}
    </div>
  )
}

function ProjectItem({ project: p, done, total, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 1, background: active ? COLORS.surfaceHover : 'transparent', transition: 'background 0.1s', userSelect: 'none' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.surfaceHover }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 7, height: 7, borderRadius: 2, background: p.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? COLORS.text : COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{p.name}</span>
      <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{done}/{total}</span>
    </div>
  )
}

function ThemeBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{ background: active ? COLORS.surface : 'transparent', border: 'none', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: active ? COLORS.textDim : COLORS.textMuted, transition: 'all 0.15s' }}
    >
      {icon && <Icon name={icon} size={13} color="currentColor" />}
      <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>{label}</span>
    </button>
  )
}

function MenuBtn({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: danger ? COLORS.red : COLORS.textDim, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 400, fontFamily: "'Geist', sans-serif", letterSpacing: '-0.01em' }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >{children}</button>
  )
}
