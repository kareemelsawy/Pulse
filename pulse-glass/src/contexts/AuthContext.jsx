import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function getCachedUser() {
  try {
    const raw = localStorage.getItem('pulse_session_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(getCachedUser)
  const [loading,    setLoading]    = useState(true)   // always start true
  const [authReady,  setAuthReady]  = useState(false)  // true once Supabase confirms session

  useEffect(() => {
    // Always verify session from Supabase before proceeding
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) localStorage.setItem('pulse_session_user', JSON.stringify(u))
      else localStorage.removeItem('pulse_session_user')
      setLoading(false)
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && getCachedUser()) return
      const u = session?.user ?? null
      setUser(u)
      if (u) localStorage.setItem('pulse_session_user', JSON.stringify(u))
      else localStorage.removeItem('pulse_session_user')
      setLoading(false)
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    localStorage.removeItem('pulse_session_user')
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, authReady, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
