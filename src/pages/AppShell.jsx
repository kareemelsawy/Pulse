import { useState, useMemo } from 'react'
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

// ── Same gradient background as login ────────────────────────────────────────
function AppBackground() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden', background:'#000' }}>
      <div style={{
        position:'absolute', inset:0,
        background:`
          radial-gradient(ellipse 110% 80% at 75% 40%, rgba(0,80,255,0.52)  0%, transparent 55%),
          radial-gradient(ellipse 70%  60% at 90% 20%, rgba(0,180,255,0.30) 0%, transparent 50%),
          radial-gradient(ellipse 50%  50% at 85% 55%, rgba(0,220,240,0.18) 0%, transparent 45%),
          radial-gradient(ellipse 90%  90% at 10% 80%, rgba(0,0,0,1.00)     0%, transparent 70%),
          radial-gradient(ellipse 80%  80% at 5%  5%,  rgba(0,0,10,0.95)    0%, transparent 60%)
        `,
      }} />
      <div style={{
        position:'absolute', inset:0,
        background:`
          radial-gradient(ellipse 40% 35% at 80% 30%, rgba(80,200,255,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 30% 25% at 65% 60%, rgba(0,120,255,0.08)  0%, transparent 50%)
        `,
      }} />
      <div style={{
        position:'absolute', inset:0, opacity:0.025, mixBlendMode:'overlay',
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  )
}

// ── Logout icon SVG ───────────────────────────────────────────────────────────
function LogoutIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function AppShell({ toast }) {
  const { user, signOut } = useAuth()
  const { workspace, projects, tasks, getProjectTasks, loading } = useData()
  const { isDark } = useTheme()
  const [view, setView]                     = useState('overview')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [sidebarOpen, setSidebarOpen]       = useState(true)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newPipelineOpen, setNewPipelineOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const activeProject    = projects.find(p => p.id === activeProjectId) || null
  const activeProjects   = projects.filter(p => !p.is_pipeline)
  const pipelineProjects = projects.filter(p => p.is_pipeline)
  const displayName      = user?.user_metadata?.full_name || user?.email || 'You'
  const isOwner          = workspace?.owner_id === user?.id

  // ── Overdue task count ───────────────────────────────────────────────────
  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(t =>
      t.status !== 'done' &&
      t.due_date &&
      t.due_date < today
    ).length
  }, [tasks])

  function go(v)          { setActiveProjectId(null); setView(v); setMobileMenuOpen(false) }
  function openProject(p) { setActiveProjectId(p.id); setView('project'); setMobileMenuOpen(false) }
  function openOverview()  { setActiveProjectId(null); setView('overview'); setMobileMenuOpen(false) }

  if (loading) return (
    <>
      <AppBackground />
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, position:'relative', zIndex:1 }}>
        <div style={{
          width:56, height:56, borderRadius:16,
          background:'linear-gradient(135deg,#6B8EF7,#C084FC)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, color:'#fff', fontWeight:900,
          boxShadow:'0 8px 32px rgba(107,142,247,0.45)',
        }}>✦</div>
        <Spinner size={24} />
      </div>
    </>
  )

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${COLORS.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg,#6B8EF7,#C084FC)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, color:'#fff', fontWeight:900,
            boxShadow:'0 4px 16px rgba(107,142,247,0.40)',
          }}>✦</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, letterSpacing:'-0.03em', color: COLORS.text }}>PULSE</div>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav style={{ padding:'8px 8px 6px', borderBottom:`1px solid ${COLORS.border}`, flexShrink:0 }}>
        <NavItem icon="grid"          label="Overview"   active={view==='overview'}   onClick={openOverview} />
        {isOwner && <NavItem icon="barChart" label="Analytics" active={view==='analytics'} onClick={() => go('analytics')} />}
        <NavItem icon="messageCircle" label="Meetings"   active={view==='meetings'}   onClick={() => go('meetings')} />
      </nav>

      {/* Projects */}
      <div style={{ flex:1, overflowY:'auto', minHeight:0, padding:'8px 8px' }}>
        <SidebarSection label="Projects" onAdd={() => { setNewProjectOpen(true); setMobileMenuOpen(false) }}>
          {activeProjects.length === 0 && (
            <div style={{ padding:'6px 10px', fontSize:12, color: COLORS.textMuted, fontStyle:'italic' }}>No projects yet</div>
          )}
          {activeProjects.map(p => {
            const ptasks = getProjectTasks(p.id)
            const done = ptasks.filter(t => t.status === 'done').length
            return <ProjectItem key={p.id} project={p} done={done} total={ptasks.length} active={activeProjectId===p.id && view==='project'} onClick={() => openProject(p)} />
          })}
        </SidebarSection>

        <div style={{ height:8 }} />

        <SidebarSection label="Pipeline" onAdd={() => { setNewPipelineOpen(true); setMobileMenuOpen(false) }}>
          <NavItem icon="inbox" label="All Pipeline" active={view==='pipeline'}
            onClick={() => go('pipeline')}
            meta={pipelineProjects.length > 0 ? String(pipelineProjects.length) : null} />
        </SidebarSection>
      </div>

      {/* Bottom */}
      <div style={{ borderTop:`1px solid ${COLORS.border}`, padding:'6px 8px 10px', flexShrink:0 }}>
        <NavItem icon="settings" label="Settings" active={view==='settings'} onClick={() => go('settings')} />
        <NavItem icon="fileText" label="Docs"     active={view==='docs'}     onClick={() => go('docs')} />

        {/* User row — no dropdown, direct logout icon */}
        <div style={{
          display:'flex', alignItems:'center', gap:9,
          padding:'7px 10px', borderRadius:10, marginTop:4,
        }}>
          <Avatar name={displayName} size={26} />
          <span style={{ flex:1, fontSize:13, fontWeight:500, color: COLORS.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</span>
          <button
            onClick={signOut}
            title="Sign out"
            style={{
              background:'none', border:'none', cursor:'pointer',
              padding:5, borderRadius:7, display:'flex', alignItems:'center',
              color: COLORS.textMuted, transition:'color 0.15s, background 0.15s', flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color=COLORS.red; e.currentTarget.style.background='rgba(239,68,68,0.10)' }}
            onMouseLeave={e => { e.currentTarget.style.color=COLORS.textMuted; e.currentTarget.style.background='none' }}>
            <LogoutIcon size={15} color="currentColor" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ display:'flex', height:'100vh', color: COLORS.text, overflow:'hidden', position:'relative' }}>
      <AppBackground />

      {/* ── Sidebar desktop ───────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="app-sidebar-desktop" style={{
          width:240, flexShrink:0, height:'100vh',
          display:'flex', flexDirection:'column', position:'relative', zIndex:10,
          background:'rgba(5,8,30,0.70)',
          backdropFilter:'blur(20px) saturate(180%)',
          WebkitBackdropFilter:'blur(20px) saturate(180%)',
          borderRight:'1px solid rgba(255,255,255,0.08)',
        }}>
          {sidebarContent}
        </aside>
      )}

      {/* ── Mobile sidebar overlay ────────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200 }} />
          <aside style={{
            position:'fixed', left:0, top:0, bottom:0, width:260,
            display:'flex', flexDirection:'column', zIndex:201,
            background:'rgba(5,8,30,0.92)',
            backdropFilter:'blur(24px)',
            WebkitBackdropFilter:'blur(24px)',
            borderRight:'1px solid rgba(255,255,255,0.10)',
            animation:'slideIn 0.2s ease',
          }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, position:'relative', zIndex:1 }}>

        {/* Header */}
        <header style={{
          height:50, flexShrink:0,
          display:'flex', alignItems:'center', padding:'0 18px', gap:12,
          background:'rgba(5,8,30,0.55)',
          backdropFilter:'blur(16px) saturate(180%)',
          WebkitBackdropFilter:'blur(16px) saturate(180%)',
          borderBottom:'1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Sidebar toggle desktop */}
          <button className="sidebar-toggle-desktop" onClick={() => setSidebarOpen(p => !p)} style={{
            background:'rgba(255,255,255,0.06)', border:`1px solid ${COLORS.border}`,
            borderRadius:8, padding:'5px 7px', cursor:'pointer', display:'flex', alignItems:'center', transition:'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            <Icon name="list" size={15} color={COLORS.textMuted} />
          </button>

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(p => !p)} style={{
            background:'rgba(255,255,255,0.06)', border:`1px solid ${COLORS.border}`,
            borderRadius:8, padding:'5px 7px', cursor:'pointer', display:'none', alignItems:'center',
          }}>
            <Icon name="menu" size={15} color={COLORS.textMuted} />
          </button>

          {/* Overdue task count */}
          {overdueCount > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)',
              borderRadius:8, padding:'4px 10px', cursor:'pointer',
            }} onClick={openOverview}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#EF4444', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:600, color:'#FCA5A5' }}>
                {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div style={{ flex:1 }} />

          <span style={{ fontSize:12, color: COLORS.textDim, fontWeight:400, letterSpacing:'0.01em' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
          </span>
        </header>

        <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
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

      <style>{`
        @media (max-width: 768px) {
          .app-sidebar-desktop { display: none !important; }
          .sidebar-toggle-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, meta }) {
  return (
    <div onClick={onClick}
      className={`nav-item${active ? ' nav-active' : ''}`}
      style={{
        display:'flex', alignItems:'center', gap:9,
        padding:'7px 10px', borderRadius:10,
        cursor:'pointer', marginBottom:2,
        border:'1px solid transparent',
        color: active ? COLORS.accent : COLORS.textDim,
        userSelect:'none',
      }}>
      <Icon name={icon} size={15} color={active ? COLORS.accent : COLORS.textMuted} />
      <span style={{ fontWeight: active ? 600 : 400, fontSize:13, flex:1, letterSpacing:'-0.01em' }}>{label}</span>
      {meta && <span style={{ fontSize:11, color: COLORS.textMuted, background:COLORS.border, borderRadius:6, padding:'1px 6px', fontFamily:"'DM Mono',monospace" }}>{meta}</span>}
    </div>
  )
}

function SidebarSection({ label, onAdd, children }) {
  return (
    <div style={{ marginBottom:2 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 10px 5px' }}>
        <span style={{ fontSize:10, fontWeight:700, color: COLORS.textMuted, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</span>
        <button onClick={onAdd} style={{ background:'none', border:'none', color: COLORS.textMuted, cursor:'pointer', padding:2, borderRadius:5, display:'flex', lineHeight:1, transition:'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.color = COLORS.textMuted}>
          <Icon name="plus" size={14} color="currentColor" />
        </button>
      </div>
      {children}
    </div>
  )
}

function ProjectItem({ project: p, done, total, active, onClick }) {
  return (
    <div onClick={onClick}
      className={`proj-item${active ? ' nav-active' : ''}`}
      style={{
        display:'flex', alignItems:'center', gap:9,
        padding:'7px 10px', borderRadius:10, cursor:'pointer', marginBottom:2,
        border:'1px solid transparent', userSelect:'none',
      }}>
      <div style={{ width:9, height:9, borderRadius:3, background:p.color, flexShrink:0, boxShadow:`0 0 6px ${p.color}80` }} />
      <span style={{ flex:1, fontSize:13, fontWeight: active ? 600 : 400, color: active ? COLORS.text : COLORS.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{p.name}</span>
      <span style={{ fontSize:11, color: COLORS.textMuted, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{done}/{total}</span>
    </div>
  )
}
