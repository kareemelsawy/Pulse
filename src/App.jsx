import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider, useData } from './contexts/DataContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useToast } from './hooks/useToast'
import { Toast, Spinner } from './components/UI'
import { DARK_THEME } from './lib/constants'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage, { SignupPage, ResetPage, NewPasswordPage } from './pages/LoginPage'
import WorkspaceSetup from './pages/WorkspaceSetup'
import AppShell from './pages/AppShell'
import GuestView from './pages/GuestView'

function AuthGate({ toast }) {
  const { user, loading: authLoading, signOut } = useAuth()
  const [page, setPage] = useState('login')

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setPage('newpassword')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    // Save invite code but DON'T remove it from URL yet — keep it in sessionStorage
    // and only clear it after a successful join
    const params = new URLSearchParams(window.location.search)
    if (params.get('invite')) {
      sessionStorage.setItem('pendingInvite', params.get('invite'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const C = DARK_THEME

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
  const C = DARK_THEME

  function handleJoined(ws) {
    // Only clear pendingInvite AFTER a successful join
    sessionStorage.removeItem('pendingInvite')
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

  // Transient DB/RLS error — don't redirect to invite screen, let user retry
  if (wsError === 'fetch_error') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: C.accent, fontWeight: 900, lineHeight: 1 }}>✦</div>
      <span style={{ color: C.textMuted, fontSize: 14, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
        Unable to load your workspace. Please check your connection and try again.
      </span>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8, padding: '10px 24px', borderRadius: 10,
          background: 'rgba(0,110,255,0.85)', color: '#fff',
          border: '1px solid rgba(80,180,255,0.3)',
          fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
        Retry
      </button>
      <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
        Sign out
      </button>
    </div>
  )

  if (wsError === 'no_workspace') {
    // Read pendingInvite but do NOT remove it here — WorkspaceSetup will call handleJoined on success
    const pendingInvite = sessionStorage.getItem('pendingInvite')
    return <WorkspaceSetup onJoined={handleJoined} onSignOut={signOut} defaultCode={pendingInvite || ''} />
  }

  if (!workspace) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: C.accent, fontWeight: 900, lineHeight: 1 }}>✦</div>
      <Spinner size={28} />
      <span style={{ color: C.textMuted, fontSize: 13 }}>Loading workspace…</span>
    </div>
  )

  return <AppShell toast={toast} />
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
