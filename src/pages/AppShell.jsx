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

// ── Pulse Logo SVG ──────────────────────────────────────────────────────────
function PulseLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="9" fill={COLORS.accent}/>
      {/* Pulse waveform */}
      <polyline
        points="4,18 9,18 12,10 15,26 18,14 21,22 24,18 32,18"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 18 }}>
      <PulseLogo size={44} />
      <Spinner size={22} />
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.bg, color: COLORS.text, overflow: 'hidden', fontFamily: "'Mona Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside style={{
          width: 248,
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.border}`,
          display: 'flex', flexDirection: 'column',
          flexShrink: 0, height: '100vh',
        }}>

          {/* ── Pulse Wordmark ── */}
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PulseLogo size={30} />
              <div>
                {/* Wordmark */}
                <div style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 20,
                  letterSpacing: '-0.04em',
                  color: COLORS.text,
                  lineHeight: 1,
                  paddingBottom: 1,
                }}>Pulse</div>
                {workspace?.name && (
                  <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 1 }}>
                    {workspace.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Primary Nav ── */}
          <nav style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
            <NavItem icon="grid"          label="Overview"   active={view === 'overview'}   onClick={openOverview} />
            {isOwner && <NavItem icon="barChart" label="Analytics" active={view === 'analytics'} onClick={() => { setActiveProjectId(null); setView('analytics') }} />}
            <NavItem icon="messageCircle" label="Meetings"   active={view === 'meetings'}   onClick={() => { setActiveProjectId(null); setView('meetings') }} />
          </nav>

          <SidebarDivider />

          {/* ── Projects ── */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 10px' }}>
            <SidebarSection label="Projects" onAdd={() => setNewProjectOpen(true)}>
              {activeProjects.length === 0 && (
                <div style={{ padding: '6px 10px 4px', fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>No projects yet</div>
              )}
              {activeProjects.map(p => {
                const ptasks = getProjectTasks(p.id)
                const done   = ptasks.filter(t => t.status === 'done').length
                const active = activeProjectId === p.id && view === 'project'
                return (
                  <ProjectItem key={p.id} project={p} done={done} total={ptasks.length} active={active} onClick={() => openProject(p)} />
                )
              })}
            </SidebarSection>

            <div style={{ height: 8 }} />

            <SidebarSection label="Pipeline" count={pipelineProjects.length} onAdd={() => setNewPipelineOpen(true)}>
              <NavItem
                icon="inbox" label="All Pipeline"
                active={view === 'pipeline'}
                onClick={() => { setActiveProjectId(null); setView('pipeline') }}
                meta={pipelineProjects.length > 0 ? String(pipelineProjects.length) : null}
              />
              {pipelineProjects.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 10px', opacity: 0.55 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, border: `1.5px solid ${p.color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
              ))}
            </SidebarSection>
          </div>

          <SidebarDivider />

          {/* ── Bottom Nav ── */}
          <div style={{ padding: '8px 10px 10px', flexShrink: 0 }}>
            <NavItem icon="settings" label="Settings" active={view === 'settings'} onClick={() => { setActiveProjectId(null); setView('settings') }} />
            <NavItem icon="fileText" label="Docs"     active={view === 'docs'}     onClick={() => { setActiveProjectId(null); setView('docs') }} />

            {/* User row */}
            <div style={{ position: 'relative', marginTop: 4 }}>
              <div
                onClick={() => setUserMenu(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <Avatar name={displayName} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.textDim }}>{displayName}</div>
                </div>
                <Icon name="chevronDown" size={13} color={COLORS.textMuted} />
              </div>
              {userMenu && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, right: 0,
                  background: COLORS.surface,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14, padding: 6, marginBottom: 6, zIndex: 50,
                  boxShadow: COLORS.cardShadow,
                  animation: 'slideDown 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  <MenuBtn onClick={() => { setUserMenu(false); setView('settings') }}>Settings</MenuBtn>
                  <div style={{ height: 1, background: COLORS.border, margin: '4px 0' }} />
                  <MenuBtn onClick={() => { setUserMenu(false); signOut() }} danger>Sign out</MenuBtn>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Toolbar */}
        <header style={{
          height: 50,
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 18px', gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            style={{
              background: 'none', border: 'none', color: COLORS.textMuted,
              cursor: 'pointer', padding: '5px 7px', borderRadius: 8,
              display: 'flex', alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <Icon name="list" size={16} color={COLORS.textMuted} />
          </button>

          <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>

          <div style={{ flex: 1 }} />

          {/* Theme pill — Apple segmented control style */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: 3, gap: 1,
          }}>
            <ThemeBtn active={!isDark} onClick={() => isDark && toggleTheme()} icon="sun"  label="Light" />
            <ThemeBtn active={isDark}  onClick={() => !isDark && toggleTheme()} icon="moon" label="Dark"  />
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

// ── Sub-components ──────────────────────────────────────────────────────────

function SidebarDivider() {
  return <div style={{ height: 1, background: COLORS.border, margin: '2px 0' }} />
}

function NavItem({ icon, label, active, onClick, meta }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 10px', borderRadius: 10,
        cursor: 'pointer',
        background: active ? COLORS.accentDim || COLORS.surfaceHover : 'transparent',
        color: active ? COLORS.accent : COLORS.textDim,
        marginBottom: 1,
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.surfaceHover }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon name={icon} size={15} color={active ? COLORS.accent : COLORS.textMuted} />
      <span style={{ fontWeight: active ? 600 : 400, fontSize: 14, flex: 1, letterSpacing: '-0.02em' }}>{label}</span>
      {meta && (
        <span style={{
          fontSize: 11, fontWeight: 500, fontFamily: "'DM Mono', monospace",
          color: COLORS.textMuted,
          background: COLORS.surfaceHover, borderRadius: 6,
          padding: '1px 6px', minWidth: 20, textAlign: 'center',
        }}>{meta}</span>
      )}
    </div>
  )
}

function SidebarSection({ label, count, onAdd, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 10px 5px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {label}{count > 0 ? ` (${count})` : ''}
        </span>
        <button
          onClick={onAdd}
          style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 2, borderRadius: 5, display: 'flex', lineHeight: 1, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.color = COLORS.textMuted}
        >
          <Icon name="plus" size={14} color="currentColor" />
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
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 10px', borderRadius: 10,
        cursor: 'pointer', marginBottom: 1,
        background: active ? COLORS.accentDim || COLORS.surfaceHover : 'transparent',
        transition: 'background 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.surfaceHover }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flexShrink: 0, boxShadow: `0 1px 3px ${p.color}60` }} />
      <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 600 : 400, color: active ? COLORS.text : COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{p.name}</span>
      <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{done}/{total}</span>
    </div>
  )
}

function ThemeBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? COLORS.surface : 'transparent',
        border: 'none', borderRadius: 7,
        padding: '4px 9px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
        color: active ? COLORS.text : COLORS.textMuted,
        fontWeight: active ? 600 : 400,
        fontSize: 12,
        transition: 'all 0.18s',
        boxShadow: active ? `0 1px 3px ${COLORS.shadow}` : 'none',
        letterSpacing: '-0.01em',
      }}
    >
      {icon && <Icon name={icon} size={12} color="currentColor" />}
      <span style={{ lineHeight: 1 }}>{label}</span>
    </button>
  )
}

function MenuBtn({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        background: 'none', border: 'none',
        color: danger ? COLORS.red : COLORS.textDim,
        padding: '8px 12px', borderRadius: 9,
        cursor: 'pointer', fontSize: 14, fontWeight: 400,
        fontFamily: "'Mona Sans', sans-serif",
        letterSpacing: '-0.01em',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >{children}</button>
  )
}
