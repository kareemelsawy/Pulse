import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setThemeColors, LIGHT_THEME, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

function applyTheme(isDark) {
  setThemeColors(isDark)
  const t = isDark ? DARK_THEME : LIGHT_THEME
  const root = document.documentElement
  Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  // Background is a CSS gradient — don't override it
  document.body.style.color = t.text
}

function shouldAutoDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function ThemeProvider({ children }) {
  // null = follow system, 'dark'/'light' = user explicit override
  const [override, setOverride] = useState(() => localStorage.getItem('pulse_theme_override') || null)

  const isDark = override === 'dark' ? true
               : override === 'light' ? false
               : shouldAutoDark()

  // Apply theme + flush inline styles on every change
  useEffect(() => {
    applyTheme(isDark)
  }, [isDark, tick])

  // Schedule re-render at each 6 AM / 6 PM boundary (only matters in auto mode)
  useEffect(() => {
    let timer
    function schedule() {
      const delay = msUntilNextBoundary()
      timer = setTimeout(() => {
        setTick(t => t + 1)   // triggers re-render → isDark recomputed → applyTheme fires
        schedule()             // schedule next boundary
      }, delay)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  const toggleTheme = useCallback(() => {
    // Manual toggle: set explicit override opposite of current
    const next = isDark ? 'light' : 'dark'
    setOverride(next)
    localStorage.setItem('pulse_theme_override', next)
  }, [isDark])

  // Allow clearing the override to return to auto (exposed for future settings toggle)
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
