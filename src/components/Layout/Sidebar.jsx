import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PiggyBank, 
  Settings,
  TrendingUp
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: Wallet, label: 'Income' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside 
      className="fixed left-0 top-0 h-screen bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl border-r border-[var(--color-border)] flex flex-col z-50"
      style={{ width: '240px' }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-[var(--color-border)]">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center glow-accent"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <TrendingUp className="w-5 h-5 text-[var(--color-bg-primary)]" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-[var(--color-text-primary)]">MoneyTracker</h1>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Personal Finance</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }, index) => (
            <motion.li 
              key={to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
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
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="font-medium text-sm relative z-10">{label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
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
      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="px-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Storage</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Data saved locally</p>
        </div>
      </div>
    </aside>
  )
}
