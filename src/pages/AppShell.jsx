import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { DARK_THEME, PROJECT_COLORS } from '../lib/constants'
import { Icon, Avatar, Spinner } from '../components/UI'
import OverviewPage, { ProjectView, PipelineView } from './Pages'
import MyTasksPage from './MyTasksPage'
import SettingsPage from './SettingsPage'
import AnalyticsPage from './AnalyticsPage'
import GlobalMeetingsPage from './GlobalMeetingsPage'

const C = DARK_THEME

const SIDEBAR_W = 230

export default function AppShell({ toast }) {
  const { user, signOut } = useAuth()
  const { workspace, projects, loading } = useData()

  const [currentPage,      setCurrentPage]      = useState('overview')
  const [selectedProject,  setSelectedProject]  = useState(null)
  const [projectSubView,   setProjectSubView]   = useState('board') // board | list | gantt
  const [sidebarOpen,      setSidebarOpen]      = useState(false)   // mobile

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'overview',  label: 'Overview',    icon: 'layoutDashboard' },
    { id: 'mytasks',   label: 'My Tasks',    icon: 'clipboardList'   },
    { id: 'meetings',  label: 'Meetings',    icon: 'messageCircle'   },
    { id: 'analytics', label: 'Analytics',   icon: 'barChart2'       },
    { id: 'settings',  label: 'Settings',    icon: 'settings'        },
  ]

  function goProject(project) {
    setSelectedProject(project)
    setCurrentPage('project')
    setProjectSubView('board')
    setSidebarOpen(false)
  }

  function goPage(id) {
    setCurrentPage(id)
    setSelectedProject(null)
    setSidebarOpen(false)
  }

  // ── Render sidebar nav ────────────────────────────────────────────────────
  function Sidebar({ mobile }) {
    return (
      <aside
        className="desktop-sidebar"
        style={{
          width: SIDEBAR_W, flexShrink: 0,
          height: '100vh', position: mobile ? 'fixed' : 'fixed',
          top: 0, left: mobile ? (sidebarOpen ? 0 : -SIDEBAR_W) : 0,
          zIndex: 50,
          background: 'rgba(6,10,20,0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          transition: 'left 0.3s ease',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#4F8EF7,#1e4fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: '#fff',
            }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.2 }}>Pulse</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>{workspace?.name}</div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ padding: '10px 10px 0', flex: 1 }}>
          {navItems.map(item => {
            const active = currentPage === item.id && !selectedProject
            return (
              <button
                key={item.id}
                className={`nav-item${active ? ' nav-active' : ''}`}
                onClick={() => goPage(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 12px', borderRadius: 8, border: '1px solid transparent',
                  background: 'transparent', color: active ? '#6B8EF7' : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
                  marginBottom: 2, textAlign: 'left',
                }}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </button>
            )
          })}

          {/* Projects section */}
          <div style={{ marginTop: 16, marginBottom: 6, padding: '0 12px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
              Projects
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '8px 12px' }}><Spinner size={14} /></div>
          ) : projects.map((proj, i) => {
            const active = selectedProject?.id === proj.id
            const color = proj.color || PROJECT_COLORS[i % PROJECT_COLORS.length]
            return (
              <button
                key={proj.id}
                className={`proj-item${active ? ' nav-active' : ''}`}
                onClick={() => goProject(proj)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 12px', borderRadius: 8, border: '1px solid transparent',
                  background: 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
                  marginBottom: 2, textAlign: 'left',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={displayName} email={user?.email} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={signOut} title="Sign out" style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0,
            }}>
              <Icon name="logOut" size={14} />
            </button>
          </div>
        </div>
      </aside>
    )
  }

  // ── Main content ──────────────────────────────────────────────────────────
  function renderPage() {
    if (selectedProject) {
      if (projectSubView === 'pipeline') return <PipelineView project={selectedProject} toast={toast} onSubView={setProjectSubView} />
      return <ProjectView project={selectedProject} subView={projectSubView} onSubView={setProjectSubView} toast={toast} />
    }
    switch (currentPage) {
      case 'overview':  return <OverviewPage onSelectProject={goProject} toast={toast} />
      case 'mytasks':   return <MyTasksPage toast={toast} />
      case 'meetings':  return <GlobalMeetingsPage toast={toast} />
      case 'analytics': return <AnalyticsPage />
      case 'settings':  return <SettingsPage toast={toast} />
      default:          return <OverviewPage onSelectProject={goProject} toast={toast} />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Page content */}
      <main style={{
        flex: 1,
        marginLeft: SIDEBAR_W,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
      }}
        className="main-content"
      >
        {/* Mobile header */}
        <div style={{
          display: 'none', padding: '14px 16px',
          background: 'rgba(6,10,20,0.9)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, zIndex: 10,
        }} className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
          }}>
            <Icon name="grid" size={20} />
          </button>
        </div>

        <div className="page-content" style={{ flex: 1 }}>
          {renderPage()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {navItems.slice(0, 4).map(item => {
          const active = currentPage === item.id && !selectedProject
          return (
            <button key={item.id} onClick={() => goPage(item.id)} style={{
              background: 'none', border: 'none',
              color: active ? '#4F8EF7' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 12px', fontSize: 10, fontWeight: 600,
            }}>
              <Icon name={item.icon} size={20} />
              {item.label}
            </button>
          )
        })}
        <button onClick={() => goPage('settings')} style={{
          background: 'none', border: 'none',
          color: currentPage === 'settings' ? '#4F8EF7' : 'rgba(255,255,255,0.4)',
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '6px 12px', fontSize: 10, fontWeight: 600,
        }}>
          <Icon name="settings" size={20} />
          Settings
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .mobile-header { display: flex !important; align-items: center; }
        }
      `}</style>
    </div>
  )
}
