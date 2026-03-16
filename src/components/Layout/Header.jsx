import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarDays, Menu, SearchIcon } from 'lucide-react'
import { getRouteByPath } from '../../config/routes'
import { ThemeToggle } from '../ui/Toggle'
import { useIsMobile } from '../../hooks/useMediaQuery'

export default function Header({ onMenuClick, onOpenCommandPalette }) {
  const location = useLocation()
  const isMobile = useIsMobile()
  const route = getRouteByPath(location.pathname)
  const title = route?.label || 'MoneyTracker'
  const description = route?.description || ''
  const today = format(new Date(), 'EEE, MMM d, yyyy')

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--color-border)]"
      style={{
        backgroundColor: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        height: 'var(--header-height)',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left side: menu button + title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button — hidden when bottom nav is active */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
            {!isMobile && description && (
              <p className="text-[13px] text-[var(--color-text-muted)]">{description}</p>
            )}
          </div>
        </div>

        {/* Right side: actions */}
        <div className="flex items-center gap-2">
          {/* Command palette trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-muted)] text-sm"
            aria-label="Open command palette"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span className="text-[13px]">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded border border-[var(--color-border)]">
              {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={onOpenCommandPalette}
            className="sm:hidden p-2 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-muted)]"
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Date display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
            <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="text-[13px] text-[var(--color-text-secondary)]">{today}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
