import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'

const pageTitles = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/income': 'Income',
  '/budget': 'Budget',
  '/settings': 'Settings',
}

export default function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'MoneyTracker'
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <header className="h-20 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{today}</p>
      </div>
    </header>
  )
}

