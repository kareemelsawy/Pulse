import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setThemeColors, LIGHT_THEME, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

function applyTheme(isDark) {
  setThemeColors(isDark)
  const t = isDark ? DARK_THEME : LIGHT_THEME
  const root = document.documentElement
  Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  document.body.style.color = t.text
}

function shouldAutoDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function ThemeProvider({ children }) {
  const [override, setOverride] = useState(() => localStorage.getItem('pulse_theme_override') || null)

  const isDark = override === 'dark' ? true
               : override === 'light' ? false
               : shouldAutoDark()

  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  // React live to OS theme changes (only when no manual override)
  useEffect(() => {
    if (override) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [override])

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    localStorage.setItem('pulse_theme_override', next)
    window.location.reload()
  }, [isDark])

  const setAutoTheme = useCallback(() => {
    setOverride(null)
    localStorage.removeItem('pulse_theme_override')
  }, [])

  const colors = isDark ? DARK_THEME : LIGHT_THEME

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setAutoTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
