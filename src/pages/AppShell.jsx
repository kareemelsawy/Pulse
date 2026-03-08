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

// ── Glass style helpers ───────────────────────────────────────────────────────
const glassPanel = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.11)',
  ...extra,
})

export default function AppShell({ toast }) {
  const { user, signOut } = useAuth()
  const { workspace, projects, getProjectTasks, loading } = useData()
  const { isDark, toggleTheme } = useTheme()
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
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{
        width:56, height:56, borderRadius:16,
        background:'linear-gradient(135deg,#6B8EF7,#C084FC)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:28, color:'#fff', fontWeight:900,
        boxShadow:'0 8px 32px rgba(107,142,247,0.45)',
      }}>✦</div>
      <Spinner size={24} />
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', color: COLORS.text, overflow:'hidden' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside style={{
          width: 240, flexShrink: 0, height:'100vh',
          display:'flex', flexDirection:'column',
          background: isDark ? 'rgba(5,8,30,0.75)' : 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(10,30,80,0.10)',
        }}>
          {/* Logo */}
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:34, height:34, borderRadius:10, flexShrink:0,
                background:'linear-gradient(135deg,#6B8EF7,#C084FC)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, color:'#fff', fontWeight:900, letterSpacing:'-2px',
                boxShadow:'0 4px 16px rgba(107,142,247,0.40)',
              }}>✦</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, letterSpacing:'-0.03em', color: COLORS.text }}>PULSE</div>
              </div>
            </div>
          </div>

          {/* Primary nav */}
          <nav style={{ padding:'8px 8px 6px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            <NavItem icon="grid"          label="Overview"   active={view==='overview'}   onClick={openOverview} />
            {isOwner && <NavItem icon="barChart" label="Analytics" active={view==='analytics'} onClick={() => { setActiveProjectId(null); setView('analytics') }} />}
            <NavItem icon="messageCircle" label="Meetings"   active={view==='meetings'}   onClick={() => { setActiveProjectId(null); setView('meetings') }} />
          </nav>

          {/* Projects */}
          <div style={{ flex:1, overflowY:'auto', minHeight:0, padding:'8px 8px' }}>
            <SidebarSection label="Projects" onAdd={() => setNewProjectOpen(true)}>
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

            <SidebarSection label="Pipeline" onAdd={() => setNewPipelineOpen(true)}>
              <NavItem icon="inbox" label="All Pipeline" active={view==='pipeline'}
                onClick={() => { setActiveProjectId(null); setView('pipeline') }}
                meta={pipelineProjects.length > 0 ? String(pipelineProjects.length) : null} />
            </SidebarSection>
          </div>

          {/* Bottom */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'6px 8px 10px', flexShrink:0 }}>
            <NavItem icon="settings" label="Settings" active={view==='settings'} onClick={() => { setActiveProjectId(null); setView('settings') }} />
            <NavItem icon="fileText" label="Docs"     active={view==='docs'}     onClick={() => { setActiveProjectId(null); setView('docs') }} />

            {/* User row */}
            <div style={{ position:'relative', marginTop:4 }}>
              <div onClick={() => setUserMenu(p => !p)} style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'7px 10px', borderRadius:10, cursor:'pointer',
                transition:'background 0.15s',
                background: userMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
              onMouseLeave={e => { if(!userMenu) e.currentTarget.style.background='transparent' }}>
                <Avatar name={displayName} size={26} />
                <span style={{ flex:1, fontSize:13, fontWeight:500, color: COLORS.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</span>
                <Icon name="chevronDown" size={13} color={COLORS.textMuted} />
              </div>

              {userMenu && (
                <div style={{
                  position:'absolute', bottom:'100%', left:0, right:0,
                  background: isDark ? 'rgba(15,12,45,0.90)' : 'rgba(255,255,255,0.90)',
                  backdropFilter:'blur(32px)',
                  WebkitBackdropFilter:'blur(32px)',
                  border:'1px solid rgba(255,255,255,0.14)',
                  borderRadius:14, padding:6, marginBottom:6, zIndex:50,
                  boxShadow:'0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
                  animation:'slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  <MenuBtn onClick={() => { setUserMenu(false); setView('settings') }}>Settings</MenuBtn>
                  <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'4px 0' }} />
                  <MenuBtn danger onClick={() => { setUserMenu(false); signOut() }}>Sign out</MenuBtn>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header */}
        <header style={{
          height:50, flexShrink:0,
          display:'flex', alignItems:'center', padding:'0 18px', gap:10,
          background: isDark ? 'rgba(5,8,30,0.70)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(10,30,80,0.09)',
        }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)',
            borderRadius:8, padding:'5px 7px', cursor:'pointer',
            display:'flex', alignItems:'center',
            transition:'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            <Icon name="list" size={15} color={COLORS.textMuted} />
          </button>

          <span style={{ fontSize:12, color: COLORS.textDim, fontFamily:"'DM Sans',sans-serif", fontWeight:400, letterSpacing:'0.01em' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
          </span>

          <div style={{ flex:1 }} />

          <button onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'} style={{
            background:'none', border:'none',
            width:32, height:32,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'opacity 0.15s', opacity:0.45, padding:0,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity='1'}
          onMouseLeave={e => e.currentTarget.style.opacity='0.45'}>
            {isDark
              ? <Icon name="sun"  size={16} color='rgba(180,210,255,0.9)' />
              : <Icon name="moon" size={16} color='rgba(60,100,200,0.9)' />}
          </button>
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
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, meta }) {
  return (
    <div onClick={onClick}
      className={`nav-item${active ? ' nav-active' : ''}`}
      style={{
        display:'flex', alignItems:'center', gap:9,
        padding:'7px 10px', borderRadius:10,
        cursor:'pointer', marginBottom:2,
        border: '1px solid transparent',
        color: active ? COLORS.accent : COLORS.textDim,
        userSelect:'none',
      }}>
      <Icon name={icon} size={15} color={active ? COLORS.accent : COLORS.textMuted} />
      <span style={{ fontWeight: active ? 600 : 400, fontSize:13, flex:1, letterSpacing:'-0.01em' }}>{label}</span>
      {meta && <span style={{ fontSize:11, color: COLORS.textMuted, background:'rgba(255,255,255,0.08)', borderRadius:6, padding:'1px 6px', fontFamily:"'DM Mono',monospace" }}>{meta}</span>}
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
        border: '1px solid transparent',
        userSelect:'none',
      }}>
      <div style={{ width:9, height:9, borderRadius:3, background:p.color, flexShrink:0, boxShadow:`0 0 6px ${p.color}80` }} />
      <span style={{ flex:1, fontSize:13, fontWeight: active ? 600 : 400, color: active ? COLORS.text : COLORS.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{p.name}</span>
      <span style={{ fontSize:11, color: COLORS.textMuted, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{done}/{total}</span>
    </div>
  )
}

function MenuBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'left',
      background:'none', border:'none',
      color: danger ? COLORS.red : COLORS.textDim,
      padding:'8px 12px', borderRadius:8,
      cursor:'pointer', fontSize:13, fontWeight:400,
      fontFamily: 'inherit', letterSpacing:'-0.01em',
      transition:'background 0.12s',
    }}
    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
    onMouseLeave={e => e.currentTarget.style.background=''}>{children}</button>
  )
}
