import { NavLink } from 'react-router-dom'
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
      className="fixed left-0 top-0 h-screen bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col z-50"
      style={{ width: '256px' }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[var(--color-bg-primary)]" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-[var(--color-text-primary)]">MoneyTracker</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          © 2025 MoneyTracker
        </p>
      </div>
    </aside>
  )
}

