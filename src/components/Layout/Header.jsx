import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'

const pageTitles = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/income': 'Income',
  '/budget': 'Budget',
  '/settings': 'Settings',
}

const pageDescriptions = {
  '/': 'Overview of your financial health',
  '/expenses': 'Track and manage your spending',
  '/income': 'Monitor your earnings',
  '/budget': 'Plan and control your budget',
  '/settings': 'Customize your preferences',
}

export default function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'MoneyTracker'
  const description = pageDescriptions[location.pathname] || ''
  const today = format(new Date(), 'EEEE, MMM d')

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-40">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </motion.div>
      
      <motion.div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">{today}</span>
      </motion.div>
    </header>
  )
}
