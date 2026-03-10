import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider, useData } from './contexts/DataContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useToast } from './hooks/useToast'
import { Toast, Spinner } from './components/UI'
import { DARK_THEME } from './lib/constants'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage, { SignupPage, ResetPage, NewPasswordPage } from './pages/LoginPage'
import AppShell from './pages/AppShell'

const C = DARK_THEME

function LoadingScreen({ text = 'Loading\u2026' }) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: C.accent, fontWeight: 900, lineHeight: 1 }}>\u2726</div>
      <Spinner size={28} />
      <span style={{ color: C.textMuted, fontSize: 13 }}>{text}</span>
    </div>
  )
}

function PendingApprovalScreen({ user, signOut, workspaceName }) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>\u23f3</div>
      <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', textAlign: 'center' }}>
        Access request sent
      </h2>
      <p style={{ color: C.textMuted, fontSize: 14, maxWidth: 360, textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
        Your request to join <strong style={{ color: C.text }}>{workspaceName || 'the workspace'}</strong> is pending admin approval. You&apos;ll be able to log in once they approve your account.
      </p>
      <div style={{ marginTop: 4, background: 'rgba(107,142,247,0.08)', border: '1px solid rgba(107,142,247,0.20)', borderRadius: 10, padding: '10px 20px', fontSize: 12, color: C.textMuted }}>
        Signed in as <strong style={{ color: C.text }}>{user?.email}</strong>
      </div>
      <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}>
        Sign out
      </button>
    </div>
  )
}

function NoAccessScreen({ user, signOut }) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>\ud83d\udd12</div>
      <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', textAlign: 'center' }}>
        No workspace access
      </h2>
      <p style={{ color: C.textMuted, fontSize: 14, maxWidth: 360, textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
        Your account hasn&apos;t been granted access yet. Please contact your workspace admin to be invited.
      </p>
      <div style={{ marginTop: 4, background: 'rgba(107,142,247,0.08)', border: '1px solid rgba(107,142,247,0.20)', borderRadius: 10, padding: '10px 20px', fontSize: 12, color: C.textMuted }}>
        Signed in as <strong style={{ color: C.text }}>{user?.email}</strong>
      </div>
      <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}>
        Sign out
      </button>
    </div>
  )
}

function WorkspaceGate({ toast }) {
  const { workspace, loading, wsError, wsPending } = useData()
  const { user, signOut } = useAuth()

  if (loading) return <LoadingScreen text="Loading workspace\u2026" />

  if (wsError === 'fetch_error') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 40, color: C.accent, fontWeight: 900, lineHeight: 1 }}>\u2726</div>
      <span style={{ color: C.textMuted, fontSize: 14, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
        Unable to load your workspace. Please check your connection and try again.
      </span>
      <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, background: 'rgba(0,110,255,0.85)', color: '#fff', border: '1px solid rgba(80,180,255,0.3)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
        Retry
      </button>
      <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
        Sign out
      </button>
    </div>
  )

  if (wsPending) return <PendingApprovalScreen user={user} signOut={signOut} workspaceName={wsPending.workspaceName} />
  if (wsError === 'no_workspace') return <NoAccessScreen user={user} signOut={signOut} />
  if (!workspace) return <LoadingScreen text="Loading workspace\u2026" />

  return <AppShell toast={toast} />
}

function AuthGate({ toast }) {
  const { user, loading: authLoading } = useAuth()
  const [page, setPage] = useState('login')

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setPage('newpassword')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    const params = new URLSearchParams(window.location.search)
    if (params.get('invite')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (authLoading) return <LoadingScreen />

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
