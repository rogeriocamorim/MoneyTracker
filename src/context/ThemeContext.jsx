import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'moneytracker_theme'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage not available
  }
  return 'system'
}

function resolveTheme(preference) {
  if (preference === 'system') return getSystemTheme()
  return preference
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getStoredTheme)
  const [resolved, setResolved] = useState(() => resolveTheme(getStoredTheme()))

  // Apply theme to <html> element
  useEffect(() => {
    const theme = resolveTheme(preference)
    setResolved(theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [preference])

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      const theme = e.matches ? 'dark' : 'light'
      setResolved(theme)
      document.documentElement.setAttribute('data-theme', theme)
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [preference])

  const setTheme = useCallback((newPreference) => {
    setPreference(newPreference)
    try {
      localStorage.setItem(STORAGE_KEY, newPreference)
    } catch {
      // localStorage not available
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  const value = {
    theme: resolved,       // 'light' | 'dark'
    preference,            // 'light' | 'dark' | 'system'
    setTheme,              // (preference) => void
    toggleTheme,           // () => void
    isDark: resolved === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
