import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider, useData } from './contexts/DataContext'
import { useToast } from './hooks/useToast'
import { Toast, Spinner } from './components/UI'
import { COLORS } from './lib/constants'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage, { SignupPage, ResetPage, NewPasswordPage } from './pages/LoginPage'
import WorkspaceSetup from './pages/WorkspaceSetup'
import AppShell from './pages/AppShell'

function AuthGate({ toast }) {
  const { user, loading: authLoading, signOut } = useAuth()
  const [page, setPage] = useState('login') // login | signup | reset | newpassword

  // Detect password reset redirect (Supabase puts #access_token in URL)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setPage('newpassword')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    // Also handle invite code in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('invite')) {
      sessionStorage.setItem('pendingInvite', params.get('invite'))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 16 }}>
      <div style={{ fontSize: 40 }}>◈</div>
      <Spinner size={28} />
    </div>
  )

  if (page === 'newpassword') return <NewPasswordPage onGoLogin={() => setPage('login')} />

  if (!user) {
    if (page === 'signup') return <SignupPage onGoLogin={() => setPage('login')} />
    if (page === 'reset')  return <ResetPage  onGoLogin={() => setPage('login')} />
    return <LoginPage onGoSignup={() => setPage('signup')} onGoReset={() => setPage('reset')} />
  }

  // User is logged in — load workspace
  return (
    <DataProvider>
      <WorkspaceGate toast={toast} onSignOut={signOut} />
    </DataProvider>
  )
}

function WorkspaceGate({ toast, onSignOut }) {
  const { workspace, loading, wsError, setWorkspace } = useData()
  const { user, signOut } = useAuth()

  // After joining, reload data
  function handleJoined(ws) {
    setWorkspace(ws)
    window.location.reload() // simplest way to re-init subscriptions
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 16 }}>
      <div style={{ fontSize: 40 }}>◈</div>
      <Spinner size={28} />
      <span style={{ color: COLORS.textMuted, fontSize: 13 }}>Loading workspace…</span>
    </div>
  )

  // No workspace yet (shouldn't happen if SQL trigger runs, but just in case)
  if (wsError === 'no_workspace' || !workspace) {
    // Check for pending invite
    const pendingInvite = sessionStorage.getItem('pendingInvite')
    if (pendingInvite) {
      sessionStorage.removeItem('pendingInvite')
      return <WorkspaceSetup onJoined={handleJoined} onSignOut={signOut} defaultCode={pendingInvite} />
    }
    return <WorkspaceSetup onJoined={handleJoined} onSignOut={signOut} />
  }

  return <AppShell toast={toast} />
}

function Inner() {
  const { toasts, toast, removeToast } = useToast()
  return (
    <>
      <AuthGate toast={toast} />
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Inner />
      </AuthProvider>
    </ErrorBoundary>
  )
}
