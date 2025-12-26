import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PiggyBank, 
  Settings,
  TrendingUp,
  X,
  GitCompare
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: Wallet, label: 'Income' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose, width = 280 }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className="fixed left-0 top-0 h-full bg-[var(--color-bg-subtle)] border-r border-[var(--color-border)] flex flex-col z-50"
        style={{ 
          width: `${width}px`,
          transform: `translateX(${isOpen ? '0' : '-100%'})`,
          transition: 'transform 0.3s ease'
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; }
          }
        `}</style>

        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center"
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[15px] text-[var(--color-text-primary)]">MoneyTracker</h1>
              <p className="text-[11px] text-[var(--color-text-muted)]">Personal Finance</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-[var(--color-border)]" />

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="px-3 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
            Menu
          </p>
          <ul className="space-y-1 mt-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose()
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-medium text-[14px]">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="px-3 py-3 rounded-lg bg-[var(--color-bg-muted)]">
            <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">Storage</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">Saved locally in browser</p>
          </div>
        </div>
      </aside>
    </>
  )
}
