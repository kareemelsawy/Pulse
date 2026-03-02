import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { useToast } from './hooks/useToast'
import { Toast, Spinner } from './components/UI'
import { COLORS } from './lib/constants'
import LoginPage, { SignupPage } from './pages/LoginPage'
import AppShell from './pages/AppShell'

function Inner() {
  const { user, loading } = useAuth()
  const { toasts, toast, removeToast } = useToast()
  const [page, setPage] = useState('login') // 'login' | 'signup'

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, gap: 16 }}>
      <div style={{ fontSize: 40 }}>◈</div>
      <Spinner size={28} />
    </div>
  )

  if (user) return (
    <>
      <DataProvider><AppShell toast={toast} /></DataProvider>
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )

  return (
    <>
      {page === 'login'
        ? <LoginPage  onGoSignup={() => setPage('signup')} />
        : <SignupPage onGoLogin={()  => setPage('login')}  />
      }
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default function App() {
  return <AuthProvider><Inner /></AuthProvider>
}
