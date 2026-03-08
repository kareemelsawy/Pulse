import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000 // 8 hours in ms

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const inactivityTimer = useRef(null)

  function resetTimer(currentUser) {
    if (!currentUser) return
    clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      supabase.auth.signOut()
    }, INACTIVITY_LIMIT)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthReady(true)
      resetTimer(u)
    })
    return () => {
      subscription.unsubscribe()
      clearTimeout(inactivityTimer.current)
    }
  }, [])

  // Reset inactivity timer on any user interaction
  useEffect(() => {
    if (!user) return
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    const handler = () => resetTimer(user)
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, handler))
  }, [user])

  async function signOut() {
    clearTimeout(inactivityTimer.current)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, authReady, loading: !authReady, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
