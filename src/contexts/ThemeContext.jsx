import { createContext, useContext, useCallback } from 'react'
import { setThemeColors, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

// Apply dark theme once on module load
setThemeColors(true)
const root = document.documentElement
Object.entries(DARK_THEME).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
root.setAttribute('data-theme', 'dark')
document.body.style.color = DARK_THEME.text
document.body.style.background = DARK_THEME.bg

export function ThemeProvider({ children }) {
  // Light mode is permanently disabled — Pulse always runs in dark mode.
  const isDark = true
  const toggleTheme = useCallback(() => {
    // no-op: light view disabled
  }, [])
  const setAutoTheme = useCallback(() => {}, [])
  const colors = DARK_THEME

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setAutoTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
