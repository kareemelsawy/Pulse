import { createContext, useContext, useEffect, useCallback } from 'react'
import { setThemeColors, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

function applyDarkTheme() {
  setThemeColors(true)
  const root = document.documentElement
  Object.entries(DARK_THEME).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  root.setAttribute('data-theme', 'dark')
  document.body.style.color = DARK_THEME.text
}

export function ThemeProvider({ children }) {
  // Always dark — light view is disabled
  const isDark = true

  useEffect(() => {
    applyDarkTheme()
    localStorage.removeItem('pulse_theme_override')
  }, [])

  // Kept for interface compatibility — toggling is disabled
  const toggleTheme = useCallback(() => {}, [])
  const setAutoTheme = useCallback(() => {}, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setAutoTheme, colors: DARK_THEME }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
