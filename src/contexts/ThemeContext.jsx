import { createContext, useContext, useEffect } from 'react'
import { setThemeColors, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

function applyDark() {
  setThemeColors(true)
  const root = document.documentElement
  Object.entries(DARK_THEME).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  root.setAttribute('data-theme', 'dark')
  document.body.style.background = '#0A0A0E'
  document.body.style.color = DARK_THEME.text
}

export function ThemeProvider({ children }) {
  useEffect(() => { applyDark() }, [])
  return (
    <ThemeContext.Provider value={{ isDark: true, toggleTheme: () => {}, colors: DARK_THEME }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
