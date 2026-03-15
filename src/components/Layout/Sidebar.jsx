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
  GitCompare,
  FileUp
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: Wallet, label: 'Income' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose, onImportStatement, width = 280 }) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className="fixed left-0 top-0 h-full flex flex-col z-50"
        style={{ 
          width: `${width}px`,
          transform: `translateX(${isOpen ? '0' : '-100%'})`,
          transition: 'transform 0.3s ease',
          background: 'var(--sidebar-bg)',
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
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[15px]" style={{ color: 'var(--sidebar-text-active)' }}>MoneyTracker</h1>
              <p className="text-[11px]" style={{ color: 'var(--sidebar-text)' }}>Personal Finance</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: 'var(--sidebar-border)' }} />

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="px-3 py-2 text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--sidebar-text)' }}>
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
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150`
                  }
                  style={({ isActive }) => ({
                    background: isActive ? 'var(--sidebar-active)' : 'transparent',
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    fontWeight: isActive ? 600 : 400,
                  })}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="text-[14px]">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Import Statement action */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            <p className="px-3 py-2 text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--sidebar-text)' }}>
              Tools
            </p>
            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose()
                onImportStatement?.()
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left"
              style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sidebar-active)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <FileUp className="w-5 h-5" strokeWidth={2} />
              <span className="text-[14px]">Import Statement</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="px-3 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--sidebar-text)' }}>Storage</p>
            <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Saved locally in browser</p>
          </div>
        </div>
      </aside>
    </>
  )
}
