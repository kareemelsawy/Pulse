import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Check if we have a cached session to skip splash on reload
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
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) localStorage.setItem('pulse_session_user', JSON.stringify(u))
      else localStorage.removeItem('pulse_session_user')
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) localStorage.setItem('pulse_session_user', JSON.stringify(u))
      else localStorage.removeItem('pulse_session_user')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
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
