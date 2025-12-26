import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarDays, Menu } from 'lucide-react'

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

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'MoneyTracker'
  const description = pageDescriptions[location.pathname] || ''
  const today = format(new Date(), 'EEE, MMM d')

  return (
    <header className="h-16 lg:h-20 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Menu className="w-6 h-6 text-[var(--color-text-primary)]" />
        </button>
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
          <p className="text-xs lg:text-sm text-[var(--color-text-muted)] hidden sm:block">{description}</p>
        </motion.div>
      </div>
      
      <motion.div 
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
        <span className="text-sm text-[var(--color-text-secondary)] hidden sm:inline">{today}</span>
        <span className="text-sm text-[var(--color-text-secondary)] sm:hidden">{format(new Date(), 'MMM d')}</span>
      </motion.div>
    </header>
  )
}
