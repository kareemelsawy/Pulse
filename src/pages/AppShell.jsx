import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useTheme } from '../contexts/ThemeContext'
import { COLORS } from '../lib/constants'
import { Spinner, Icon } from '../components/UI'
import { OverviewPage, ProjectView, NewProjectModal, PipelineView, NewPipelineModal } from './Pages'
import DocsPage from './DocsPage'
import GlobalMeetingsPage from './GlobalMeetingsPage'
import SettingsPage from './SettingsPage'
import AnalyticsPage from './AnalyticsPage'

export default function AppShell({ toast }) {
  const { user, signOut } = useAuth()
  const { workspace, projects, getProjectTasks, loading } = useData()
  const { isDark, toggleTheme } = useTheme()
  const [view, setView]                     = useState('overview')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newPipelineOpen, setNewPipelineOpen] = useState(false)
  const [userMenu, setUserMenu]             = useState(false)

  const activeProject    = projects.find(p => p.id === activeProjectId) || null
  const activeProjects   = projects.filter(p => !p.is_pipeline)
  const pipelineProjects = projects.filter(p => p.is_pipeline)
  const displayName      = user?.user_metadata?.full_name || user?.email || 'You'
  const initials         = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isOwner          = workspace?.owner_id === user?.id

  function go(v)           { setActiveProjectId(null); setView(v) }
  function openProject(p)  { setActiveProjectId(p.id); setView('project') }
  function openOverview()  { setActiveProjectId(null); setView('overview') }

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: COLORS.bg }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:10, background: COLORS.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18 }}>✦</div>
        <Spinner size={18} />
      </div>
    </div>
  )

  const railNav = [
    { icon:'grid',          v:'overview',  tip:'Overview'  },
    { icon:'barChart',      v:'analytics', tip:'Analytics', ownerOnly: true },
    { icon:'messageCircle', v:'meetings',  tip:'Meetings'  },
    { icon:'inbox',         v:'pipeline',  tip:'Pipeline'  },
    { icon:'fileText',      v:'docs',      tip:'Docs'      },
  ]

  // Current view label
  const viewLabel = view==='project' && activeProject ? activeProject.name
    : view==='overview'?'Overview' : view==='analytics'?'Analytics'
    : view==='meetings'?'Meetings' : view==='pipeline'?'Pipeline'
    : view==='settings'?'Settings' : view==='docs'?'Docs' : ''

  return (
    <div className="app-root" style={{ color: COLORS.text, fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── Icon rail ─────────────────────────────────────────────── */}
      <div className="rail" style={{ width:52, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', zIndex:10 }}>

        {/* Logo */}
        <div style={{ width:32, height:32, borderRadius:9, background: COLORS.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:17, marginBottom:16, flexShrink:0 }}>✦</div>

        {/* Main nav */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', width:'100%', padding:'0 7px', gap:2 }}>
          {railNav.filter(r => !r.ownerOnly || isOwner).map(({ icon, v, tip }) => (
            <button key={v} className={`rail-btn${view===v?' active':''}`} title={tip} onClick={() => v==='overview' ? openOverview() : go(v)}>
              <Icon name={icon} size={17} color={view===v ? '#F0F0F2' : COLORS.railText} />
            </button>
          ))}
        </div>

        {/* Bottom rail */}
        <div style={{ display:'flex', flexDirection:'column', width:'100%', padding:'0 7px', gap:2 }}>
          <button className={`rail-btn${view==='settings'?' active':''}`} title="Settings" onClick={() => go('settings')}>
            <Icon name="settings" size={17} color={view==='settings' ? '#F0F0F2' : COLORS.railText} />
          </button>
          <button className="rail-btn" title={isDark?'Light mode':'Dark mode'} onClick={toggleTheme} style={{ opacity:0.6 }}>
            <Icon name={isDark?'sun':'moon'} size={15} color={COLORS.railText} />
          </button>

          {/* User avatar */}
          <div style={{ position:'relative' }}>
            <button className="rail-btn" onClick={() => setUserMenu(p=>!p)} style={{ background: userMenu?'rgba(255,255,255,0.10)':'transparent' }}>
              <div style={{ width:26, height:26, borderRadius:7, background: COLORS.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', letterSpacing:'0.03em' }}>{initials}</div>
            </button>
            {userMenu && (
              <>
                <div onClick={() => setUserMenu(false)} style={{ position:'fixed', inset:0, zIndex:90 }} />
                <div style={{ position:'absolute', bottom:0, left:'calc(100% + 10px)', background: COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:6, zIndex:100, minWidth:196, boxShadow: COLORS.modalShadow, animation:'slideIn 0.12s ease' }}>
                  <div style={{ padding:'8px 12px 10px', borderBottom:`1px solid ${COLORS.border}`, marginBottom:4 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: COLORS.text }}>{displayName}</div>
                    <div style={{ fontSize:11, color: COLORS.textMuted, marginTop:2 }}>{user?.email}</div>
                  </div>
                  <MenuBtn onClick={() => { setUserMenu(false); go('settings') }}>Settings</MenuBtn>
                  <MenuBtn danger onClick={() => { setUserMenu(false); signOut() }}>Sign out</MenuBtn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Side panel ────────────────────────────────────────────── */}
      <aside style={{ width:224, flexShrink:0, height:'100vh', display:'flex', flexDirection:'column', background: isDark ? COLORS.bgSecondary : COLORS.bgTertiary, borderRight:`1px solid ${COLORS.border}`, overflow:'hidden' }}>

        {/* Workspace header */}
        <div style={{ padding:'16px 14px 13px', borderBottom:`1px solid ${COLORS.border}`, flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color: COLORS.text, letterSpacing:'-0.01em', marginBottom:2 }}>{workspace?.name || 'Workspace'}</div>
          <div style={{ fontSize:11, color: COLORS.textMuted }}>
            {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
          </div>
        </div>

        {/* Nav scroll area */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 6px', minHeight:0 }}>

          {/* Primary views */}
          <div style={{ marginBottom:6 }}>
            <NavItem icon="grid"          label="Overview"   active={view==='overview'}   onClick={openOverview} />
            {isOwner && <NavItem icon="barChart" label="Analytics" active={view==='analytics'} onClick={() => go('analytics')} />}
            <NavItem icon="messageCircle" label="Meetings"   active={view==='meetings'}   onClick={() => go('meetings')} />
            <NavItem icon="inbox"         label="Pipeline"   active={view==='pipeline'}   onClick={() => go('pipeline')}
              badge={pipelineProjects.length > 0 ? String(pipelineProjects.length) : null} />
          </div>

          <div className="divider" style={{ margin:'4px 4px 10px' }} />

          {/* Projects */}
          <SectionLabel label="Projects" onAdd={() => setNewProjectOpen(true)} />
          {activeProjects.length === 0
            ? <div style={{ padding:'5px 10px 8px', fontSize:12, color: COLORS.textMuted, fontStyle:'italic' }}>No projects yet</div>
            : activeProjects.map(p => {
                const ptasks = getProjectTasks(p.id)
                const done = ptasks.filter(t => t.status==='done').length
                return <ProjectItem key={p.id} project={p} done={done} total={ptasks.length} active={activeProjectId===p.id && view==='project'} onClick={() => openProject(p)} />
              })
          }
        </div>

        {/* Bottom nav */}
        <div style={{ padding:'6px', borderTop:`1px solid ${COLORS.border}`, flexShrink:0 }}>
          <NavItem icon="settings" label="Settings" active={view==='settings'} onClick={() => go('settings')} />
          <NavItem icon="fileText" label="Docs"     active={view==='docs'}     onClick={() => go('docs')} />
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background: COLORS.bg }}>

        {/* Top bar */}
        <header style={{ height:48, flexShrink:0, display:'flex', alignItems:'center', padding:'0 20px', gap:12, background: isDark ? COLORS.bgSecondary : COLORS.bgTertiary, borderBottom:`1px solid ${COLORS.border}` }}>
          <span style={{ fontSize:14, fontWeight:600, color: COLORS.text, letterSpacing:'-0.015em', flex:1 }}>{viewLabel}</span>
          <button onClick={toggleTheme} style={{
            background: 'none', border:`1px solid ${COLORS.border}`, borderRadius:7,
            padding:'4px 10px', display:'flex', alignItems:'center', gap:5,
            fontSize:11, color: COLORS.textMuted, fontFamily:'inherit',
            transition:'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Icon name={isDark?'sun':'moon'} size={12} color={COLORS.textMuted} />
            {isDark ? 'Light' : 'Dark'}
          </button>
        </header>

        <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
          {view==='overview'  && <OverviewPage onOpenProject={openProject} onNewProject={() => setNewProjectOpen(true)} workspaceName={workspace?.name} />}
          {view==='analytics' && isOwner && <AnalyticsPage />}
          {view==='project'   && activeProject && <ProjectView key={activeProject.id} project={activeProject} toast={toast} />}
          {view==='settings'  && <SettingsPage toast={toast} />}
          {view==='pipeline'  && <PipelineView onConvertToProject={() => setView('overview')} toast={toast} />}
          {view==='meetings'  && <GlobalMeetingsPage toast={toast} />}
          {view==='docs'      && <DocsPage />}
        </main>
      </div>

      {newProjectOpen  && <NewProjectModal  onClose={() => setNewProjectOpen(false)}  toast={toast} />}
      {newPipelineOpen && <NewPipelineModal onClose={() => setNewPipelineOpen(false)} toast={toast} />}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} className={`nav-item${active?' active':''}`}>
      <Icon name={icon} size={14} color={active ? COLORS.accent : COLORS.textMuted} />
      <span style={{ flex:1, fontSize:13 }}>{label}</span>
      {badge && <span style={{ fontSize:10, fontWeight:600, color: COLORS.textMuted, background: COLORS.surfaceHover, borderRadius:5, padding:'1px 6px', fontFamily:"'DM Mono',monospace" }}>{badge}</span>}
    </div>
  )
}

function SectionLabel({ label, onAdd }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 10px 5px' }}>
      <span className="section-label" style={{ padding:0 }}>{label}</span>
      {onAdd && <button onClick={onAdd} style={{ background:'none', border:'none', padding:2, color: COLORS.textFaint, display:'flex', lineHeight:1, borderRadius:4, transition:'color 0.1s' }}
        onMouseEnter={e=>e.currentTarget.style.color=COLORS.text} onMouseLeave={e=>e.currentTarget.style.color=COLORS.textFaint}>
        <Icon name="plus" size={13} color="currentColor" />
      </button>}
    </div>
  )
}

function ProjectItem({ project: p, done, total, active, onClick }) {
  return (
    <div onClick={onClick} className={`proj-item${active?' active':''}`}>
      <div style={{ width:7, height:7, borderRadius:2, background:p.color, flexShrink:0 }} />
      <span style={{ flex:1, fontSize:13, fontWeight:active?600:400, color:active?COLORS.text:COLORS.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
      <span style={{ fontSize:10, color: COLORS.textFaint, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{done}/{total}</span>
    </div>
  )
}

function MenuBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ width:'100%', textAlign:'left', background:'none', border:'none', color: danger ? COLORS.red : COLORS.textDim, padding:'7px 12px', borderRadius:7, fontSize:13, fontFamily:'inherit', transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>{children}</button>
  )
}
