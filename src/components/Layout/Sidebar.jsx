import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PiggyBank, 
  Settings,
  TrendingUp,
  X
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: Wallet, label: 'Income' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose, width = 280 }) {
  return (
    <>
      {/* Mobile overlay - only shown when sidebar is open on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - always visible on desktop (lg+), slide-in on mobile */}
      <aside 
        className="fixed left-0 top-0 h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col z-50"
        style={{ 
          width: `${width}px`,
          transform: `translateX(${isOpen ? '0' : '-100%'})`,
          transition: 'transform 0.3s ease'
        }}
      >
        {/* Override transform for desktop - always show */}
        <style>{`
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; }
          }
        `}</style>

        {/* Header */}
        <div className="p-5 lg:p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center glow-accent"
              style={{ background: 'var(--gradient-accent)' }}
            >
              <TrendingUp className="w-6 h-6 text-[var(--color-bg-primary)]" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[var(--color-text-primary)]">MoneyTracker</h1>
              <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">Personal Finance</p>
            </div>
          </motion.div>
          
          {/* Close button - mobile only */}
          <button 
            onClick={onClose}
            className="lg:hidden p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X className="w-6 h-6 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 lg:p-5 overflow-y-auto">
          <p className="px-4 mb-4 text-[11px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">
            Menu
          </p>
          <ul className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }, index) => (
              <motion.li 
                key={to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <NavLink
                  to={to}
                  onClick={() => {
                    // Only close on mobile
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={({ isActive }) =>
                    `group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-[var(--color-accent-muted)] rounded-xl"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <Icon className="w-7 h-7 relative z-10" strokeWidth={1.5} />
                      <span className="font-semibold text-base relative z-10">{label}</span>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                          style={{ background: 'var(--gradient-accent)' }}
                          layoutId="activeIndicator"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 lg:p-5 border-t border-[var(--color-border)]">
          <div className="px-4 py-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Storage</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Data saved locally</p>
          </div>
        </div>
      </aside>
    </>
  )
}
