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
  const [user,    setUser]    = useState(getCachedUser)
  const [loading, setLoading] = useState(!getCachedUser())

  useEffect(() => {
    // On mount: read current session (handles OAuth redirect token in URL hash)
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) localStorage.setItem('pulse_session_user', JSON.stringify(u))
      else localStorage.removeItem('pulse_session_user')
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED fires on tab focus and would cause DataContext to re-init.
      // Only skip it when a user is already signed in (tab-switch case).
      // If there's no user yet it means this is the real sign-in event — let it through.
      if (event === 'TOKEN_REFRESHED' && getCachedUser()) return

      const u = session?.user ?? null
      setUser(u)
      if (u) localStorage.setItem('pulse_session_user', JSON.stringify(u))
      else localStorage.removeItem('pulse_session_user')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    localStorage.removeItem('pulse_session_user')
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
