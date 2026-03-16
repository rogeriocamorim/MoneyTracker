import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { MoreHorizontal, Plus } from 'lucide-react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBottomNavRoutes, mainRoutes } from '../../config/routes'

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const bottomRoutes = getBottomNavRoutes()
  const moreRoutes = mainRoutes.filter((r) => !r.showInBottomNav)

  // Split routes: first 2 on left, last 2 on right of center FAB
  const leftRoutes = bottomRoutes.slice(0, 2)
  const rightRoutes = bottomRoutes.slice(2, 4)

  const handleQuickAdd = useCallback(
    (path) => {
      setShowQuickAdd(false)
      navigate(path)
    },
    [navigate]
  )

  return (
    <>
      {/* More sheet overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[90] backdrop-blur-sm"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-[72px] left-0 right-0 z-[95] bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] rounded-t-[var(--radius-xl)] p-4 pb-2"
            >
              <div className="w-10 h-1 rounded-full bg-[var(--color-bg-muted)] mx-auto mb-3" />
              <div className="flex flex-col gap-1">
                {moreRoutes.map((route) => {
                  const Icon = route.icon
                  return (
                    <NavLink
                      key={route.path}
                      to={route.path}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors ${
                          isActive
                            ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                            : 'text-[var(--color-text-secondary)] active:bg-[var(--color-bg-hover)]'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{route.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick-add popover */}
      <AnimatePresence>
        {showQuickAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              onClick={() => setShowQuickAdd(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-[95] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-2 min-w-[160px]"
            >
              <button
                onClick={() => handleQuickAdd('/expenses')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] active:bg-[var(--color-bg-hover)] transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--color-danger-muted)] flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                </span>
                <span className="font-medium">Add Expense</span>
              </button>
              <button
                onClick={() => handleQuickAdd('/income')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] active:bg-[var(--color-bg-hover)] transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--color-success-muted)] flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-[var(--color-success)]" />
                </span>
                <span className="font-medium">Add Income</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[var(--color-bg-elevated)]/95 backdrop-blur-md border-t border-[var(--color-border)] lg:hidden">
        <div
          className="flex items-center justify-around h-[72px] px-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Left nav items */}
          {leftRoutes.map((route) => {
            const Icon = route.icon
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-[var(--radius-lg)] transition-all min-w-[56px] ${
                    isActive
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] active:text-[var(--color-text-secondary)] active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      {isActive && (
                        <motion.div
                          layoutId="bottomnav-dot"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{route.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}

          {/* Center FAB */}
          <button
            onClick={() => {
              setShowMore(false)
              setShowQuickAdd((prev) => !prev)
            }}
            className={`relative -mt-5 flex items-center justify-center w-12 h-12 rounded-full shadow-[var(--shadow-md)] transition-all active:scale-90 ${
              showQuickAdd
                ? 'bg-[var(--color-text-primary)] rotate-45'
                : 'bg-[var(--color-accent)]'
            }`}
          >
            <Plus
              className="w-6 h-6 text-white transition-transform"
              strokeWidth={2.5}
            />
          </button>

          {/* Right nav items */}
          {rightRoutes.map((route) => {
            const Icon = route.icon
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-[var(--radius-lg)] transition-all min-w-[56px] ${
                    isActive
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] active:text-[var(--color-text-secondary)] active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      {isActive && (
                        <motion.div
                          layoutId="bottomnav-dot"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{route.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}

          {/* More button */}
          <button
            onClick={() => {
              setShowQuickAdd(false)
              setShowMore(!showMore)
            }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-[var(--radius-lg)] transition-all min-w-[56px] active:scale-95 ${
              showMore
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={showMore ? 2.5 : 2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
