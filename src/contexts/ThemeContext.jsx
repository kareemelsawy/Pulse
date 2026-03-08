import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setThemeColors, LIGHT_THEME, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

function applyTheme(isDark) {
  setThemeColors(isDark)
  const t = isDark ? DARK_THEME : LIGHT_THEME
  const root = document.documentElement
  Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  document.body.style.background = t.bg
  document.body.style.color = t.text
}

function shouldAutoDark() {
  const h = new Date().getHours()
  return h >= 18 || h < 6  // dark from 6 PM to 6 AM
}

// ms until the next 06:00 or 18:00 boundary
function msUntilNextBoundary() {
  const now  = new Date()
  const h    = now.getHours()
  const m    = now.getMinutes()
  const s    = now.getSeconds()
  const ms   = now.getMilliseconds()
  const elapsed = ((h % 12) * 3600 + m * 60 + s) * 1000 + ms
  const halfDay = 12 * 3600 * 1000
  return halfDay - (elapsed % halfDay)
}

export function ThemeProvider({ children }) {
  // manual override: null = follow auto, 'dark'/'light' = user chose
  const [override, setOverride] = useState(() => localStorage.getItem('pulse_theme_override') || null)
  const [tick,     setTick]     = useState(0)   // increment to force re-render on boundary

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
    setTick(t => t + 1)
  }, [])

  const colors = isDark ? DARK_THEME : LIGHT_THEME

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setAutoTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
