import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarDays, Menu } from 'lucide-react'

const pageTitles = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/income': 'Income',
  '/budget': 'Budget',
  '/settings': 'Settings',
}

const pageDescriptions = {
  '/': 'Overview of your finances',
  '/expenses': 'Track your spending',
  '/income': 'Monitor your earnings',
  '/budget': 'Manage your budgets',
  '/settings': 'App preferences',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'MoneyTracker'
  const description = pageDescriptions[location.pathname] || ''
  const today = format(new Date(), 'EEE, MMM d, yyyy')

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg-base)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <Menu className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
          
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
            <p className="text-[13px] text-[var(--color-text-muted)] hidden sm:block">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
          <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-[13px] text-[var(--color-text-secondary)] hidden sm:inline">{today}</span>
          <span className="text-[13px] text-[var(--color-text-secondary)] sm:hidden">{format(new Date(), 'MMM d')}</span>
        </div>
      </div>
    </header>
  )
}
