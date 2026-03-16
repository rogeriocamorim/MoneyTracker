import { NavLink } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBottomNavRoutes, mainRoutes } from '../../config/routes'

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)
  const bottomRoutes = getBottomNavRoutes()
  const moreRoutes = mainRoutes.filter((r) => !r.showInBottomNav)

  return (
    <>
      {/* Bottom sheet overlay */}
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
              className="fixed bottom-[68px] left-0 right-0 z-[95] bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] rounded-t-[var(--radius-xl)] p-4"
            >
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
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
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

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-[68px] px-2">
          {bottomRoutes.map((route) => {
            const Icon = route.icon
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-[var(--radius-lg)] transition-colors min-w-[60px] ${
                    isActive
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{route.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-[var(--radius-lg)] transition-colors min-w-[60px] ${
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
