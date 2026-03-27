import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  X,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  HardDrive,
} from 'lucide-react'
import { getGroupedRoutes, toolActions } from '../../config/routes'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import Tooltip from '../ui/Tooltip'

const COLLAPSE_KEY = 'moneytracker_sidebar_collapsed'

const groupLabels = {
  main: 'Menu',
  tools: 'Tools',
}

function getStoredCollapse() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'true'
  } catch {
    return false
  }
}

export default function Sidebar({ isOpen, onClose, onAction }) {
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(getStoredCollapse)
  const grouped = getGroupedRoutes()

  // Persist collapse state
  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    if (!isDesktop) onClose?.()
  }, [location.pathname, isDesktop]) // eslint-disable-line react-hooks/exhaustive-deps

  // Actual width based on desktop collapsed state
  const sidebarWidth = isDesktop
    ? collapsed
      ? 'var(--sidebar-width-collapsed)'
      : 'var(--sidebar-width-expanded)'
    : 'var(--sidebar-width-expanded)'

  // Check if Google Drive is connected (check localStorage)
  const isGoogleDriveConnected = (() => {
    try {
      return localStorage.getItem('moneytracker_gdrive_token') !== null
    } catch {
      return false
    }
  })()

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className="fixed left-0 top-0 h-full flex flex-col z-50 overflow-hidden"
        style={{
          width: sidebarWidth,
          transform: isDesktop
            ? 'translateX(0)'
            : isOpen
              ? 'translateX(0)'
              : 'translateX(-100%)',
          transition: 'transform var(--transition-sidebar), width var(--transition-sidebar)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          boxShadow: '4px 0 20px -4px rgb(26 22 16 / 0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--sidebar-bg-active)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--sidebar-accent)' }} />
            </div>
            {(!isDesktop || !collapsed) && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-semibold text-[15px]" style={{ color: 'var(--sidebar-text-active)' }}>
                  MoneyTracker
                </h1>
              </div>
            )}
          </div>

          {/* Close button (mobile) / Collapse button (desktop) */}
          {!isDesktop ? (
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--sidebar-text)' }}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--sidebar-bg-hover)]"
              style={{ color: 'var(--sidebar-text)' }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 h-px shrink-0" style={{ background: 'var(--sidebar-border)' }} />

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {Object.entries(grouped).map(([group, routes]) => (
            <div key={group} className="mb-4">
              {/* Group label */}
              {(!isDesktop || !collapsed) && (
                <p
                  className="px-3 py-2 text-[11px] uppercase tracking-wider font-medium"
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  {groupLabels[group] || group}
                </p>
              )}

              <ul className="space-y-0.5">
                {routes.map((route) => {
                  const Icon = route.icon
                  const isCollapsedDesktop = isDesktop && collapsed

                  const link = (
                    <NavLink
                      to={route.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg transition-all duration-150 relative
                        ${isCollapsedDesktop ? 'justify-center px-0 py-2.5 mx-auto' : 'px-3 py-2.5'}
                        ${isActive
                          ? 'font-medium'
                          : 'hover:bg-[var(--sidebar-bg-hover)]'
                        }`
                      }
                      style={({ isActive }) => ({
                        background: isActive ? 'var(--sidebar-bg-active)' : undefined,
                        color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active indicator bar */}
                          {isActive && (
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                              style={{ background: 'var(--sidebar-accent)' }}
                            />
                          )}
                          <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.2 : 2} />
                          {!isCollapsedDesktop && (
                            <span className="text-[14px] truncate">{route.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  )

                  return (
                    <li key={route.path}>
                      {isCollapsedDesktop ? (
                        <Tooltip content={route.label} position="right" delay={200}>
                          {link}
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {/* Tool actions (Import Statement, etc.) */}
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            {(!isDesktop || !collapsed) && (
              <p
                className="px-3 py-2 text-[11px] uppercase tracking-wider font-medium"
                style={{ color: 'var(--sidebar-text)' }}
              >
                Actions
              </p>
            )}
            {toolActions.map((action) => {
              const Icon = action.icon
              const isCollapsedDesktop = isDesktop && collapsed

              const btn = (
                <button
                  onClick={() => {
                    if (!isDesktop) onClose?.()
                    onAction?.(action.id)
                  }}
                  className={`flex items-center gap-3 rounded-lg transition-all duration-150 w-full text-left
                    hover:bg-[var(--sidebar-bg-hover)]
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60
                    ${isCollapsedDesktop ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}`}
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                  {!isCollapsedDesktop && (
                    <span className="text-[14px] truncate">{action.label}</span>
                  )}
                </button>
              )

              return (
                <div key={action.id}>
                  {isCollapsedDesktop ? (
                    <Tooltip content={action.label} position="right" delay={200}>
                      {btn}
                    </Tooltip>
                  ) : (
                    btn
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer — storage status */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          {(!isDesktop || !collapsed) ? (
            <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--sidebar-bg-hover)' }}>
              <div className="flex items-center gap-2">
                {isGoogleDriveConnected ? (
                  <Cloud className="w-4 h-4 shrink-0" style={{ color: 'var(--sidebar-accent)' }} />
                ) : (
                  <HardDrive className="w-4 h-4 shrink-0" style={{ color: 'var(--sidebar-text)' }} />
                )}
                <div className="overflow-hidden">
                  <p className="text-[11px] font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>
                    {isGoogleDriveConnected ? 'Google Drive' : 'Local Storage'}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--sidebar-text)' }}>
                    {isGoogleDriveConnected ? 'Synced to cloud' : 'Saved in browser'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Tooltip
              content={isGoogleDriveConnected ? 'Google Drive synced' : 'Saved locally'}
              position="right"
              delay={200}
            >
              <div className="flex justify-center py-2">
                {isGoogleDriveConnected ? (
                  <Cloud className="w-4 h-4" style={{ color: 'var(--sidebar-accent)' }} />
                ) : (
                  <HardDrive className="w-4 h-4" style={{ color: 'var(--sidebar-text)' }} />
                )}
              </div>
            </Tooltip>
          )}
        </div>
      </aside>
    </>
  )
}
