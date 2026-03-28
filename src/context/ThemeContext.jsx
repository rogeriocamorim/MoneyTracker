import { createContext, useContext, useState, useCallback } from 'react'

const ThemeContext = createContext(null)

const THEME_KEY = 'moneytracker_theme'

export function ThemeProvider({ children }) {
  const [theme] = useState('light') // light-only for now, future dark-mode support

  const value = {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme} className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
