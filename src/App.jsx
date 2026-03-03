import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider, useData } from './contexts/DataContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { useToast } from './hooks/useToast'
import { Toast, Spinner } from './components/UI'
import { DARK_THEME, LIGHT_THEME } from './lib/constants'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage, { SignupPage, ResetPage, NewPasswordPage } from './pages/LoginPage'
import WorkspaceSetup from './pages/WorkspaceSetup'
import AppShell from './pages/AppShell'

function AuthGate({ toast }) {
  const { user, loading: authLoading, signOut } = useAuth()
  const { isDark } = useTheme()
  const [page, setPage] = useState('login')

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setPage('newpassword')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    const params = new URLSearchParams(window.location.search)
    if (params.get('invite')) {
      sessionStorage.setItem('pendingInvite', params.get('invite'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const C = isDark ? DARK_THEME : LIGHT_THEME

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: C.accent, fontWeight: 900, lineHeight: 1 }}>✦</div>
      <Spinner size={28} />
    </div>
  )

  if (page === 'newpassword') return <NewPasswordPage onGoLogin={() => setPage('login')} />
  if (!user) {
    if (page === 'signup') return <SignupPage onGoLogin={() => setPage('login')} />
    if (page === 'reset')  return <ResetPage  onGoLogin={() => setPage('login')} />
    return <LoginPage onGoSignup={() => setPage('signup')} onGoReset={() => setPage('reset')} />
  }

  return (
    <DataProvider>
      <WorkspaceGate toast={toast} />
    </DataProvider>
  )
}

function WorkspaceGate({ toast }) {
  const { workspace, loading, wsError, setWorkspace } = useData()
  const { user, signOut } = useAuth()
  const { isDark } = useTheme()
  const C = isDark ? DARK_THEME : LIGHT_THEME

  function handleJoined(ws) {
    setWorkspace(ws)
    window.location.reload()
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: C.accent, fontWeight: 900, lineHeight: 1 }}>✦</div>
      <Spinner size={28} />
      <span style={{ color: C.textMuted, fontSize: 13 }}>Loading workspace…</span>
    </div>
  )

  if (wsError === 'no_workspace' || !workspace) {
    const pendingInvite = sessionStorage.getItem('pendingInvite')
    if (pendingInvite) {
      sessionStorage.removeItem('pendingInvite')
      return <WorkspaceSetup onJoined={handleJoined} onSignOut={signOut} defaultCode={pendingInvite} />
    }
    return <WorkspaceSetup onJoined={handleJoined} onSignOut={signOut} />
  }

  // key={isDark} remounts AppShell instantly when theme changes,
  // flushing all inline COLORS references without touching auth/data state.
  return <AppShell key={isDark ? 'dark' : 'light'} toast={toast} />
}

function Inner() {
  const { toasts, toast, removeToast } = useToast()
  return (
    <div>
      <AuthGate toast={toast} />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Inner />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
