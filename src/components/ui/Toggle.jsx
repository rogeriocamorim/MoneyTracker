import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

/**
 * Generic toggle switch
 */
export function Toggle({
  checked = false,
  onChange,
  label,
  size = 'md',
  disabled = false,
  className = '',
}) {
  const sizeMap = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
  }

  const s = sizeMap[size]

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`
          relative inline-flex items-center shrink-0 ${s.track}
          rounded-full transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
          ${checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-muted)]'}
        `}
      >
        <span
          className={`
            inline-block ${s.thumb} rounded-full bg-white shadow-sm
            transform transition-transform duration-200 ease-in-out
            ${checked ? s.translate : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && <span className="text-sm text-[var(--color-text-primary)]">{label}</span>}
    </label>
  )
}

/**
 * Theme toggle button
 */
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-[var(--radius-lg)] transition-colors
        text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
        hover:bg-[var(--color-bg-hover)]
        ${className}
      `}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  )
}
