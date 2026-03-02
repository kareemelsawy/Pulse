import { createContext, useContext, useState, useEffect } from 'react'
import { setThemeColors, LIGHT_THEME, DARK_THEME } from '../lib/constants'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pulse_theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    setThemeColors(isDark)
    localStorage.setItem('pulse_theme', isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    document.body.style.background = isDark ? DARK_THEME.bg : LIGHT_THEME.bg
    document.body.style.color = isDark ? DARK_THEME.text : LIGHT_THEME.text
  }, [isDark])

  // Init on mount
  useEffect(() => { setThemeColors(isDark) }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
