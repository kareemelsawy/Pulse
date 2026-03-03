import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setThemeColors, LIGHT_THEME, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

function applyTheme(isDark) {
  const t = isDark ? DARK_THEME : LIGHT_THEME
  // Mutate the shared COLORS object so all inline styles pick it up on next render
  setThemeColors(isDark)
  // Also set CSS variables for anything that uses them
  const root = document.documentElement
  Object.entries(t).forEach(([k, v]) => {
    root.style.setProperty(`--color-${k}`, v)
  })
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  document.body.style.background = t.bg
  document.body.style.color = t.text
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pulse_theme')
    return saved ? saved === 'dark' : false  // default: light
  })

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(isDark)
    localStorage.setItem('pulse_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = useCallback(() => {
    setIsDark(d => !d)
  }, [])

  // Expose the current color palette so SettingsPage and others can use it
  const colors = isDark ? DARK_THEME : LIGHT_THEME

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
