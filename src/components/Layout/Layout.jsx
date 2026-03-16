import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from '../ui/BottomNav'
import CommandPalette from '../ui/CommandPalette'
import { useIsDesktop, useIsMobile } from '../../hooks/useMediaQuery'
import { Spinner } from '../ui/Spinner'

const StatementImport = lazy(() => import('../StatementImport'))

const COLLAPSE_KEY = 'moneytracker_sidebar_collapsed'

function getStoredCollapse() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'true'
  } catch {
    return false
  }
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showStatementImport, setShowStatementImport] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Track sidebar collapsed state for margin calculation
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapse)

  // Sync collapsed state from localStorage (Sidebar writes it)
  useEffect(() => {
    const handleStorage = () => setSidebarCollapsed(getStoredCollapse())

    // Poll for changes since Sidebar writes to localStorage directly
    const interval = setInterval(handleStorage, 300)
    return () => clearInterval(interval)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [location.pathname, isDesktop])

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle actions from CommandPalette and Sidebar
  const handleAction = useCallback((actionId) => {
    switch (actionId) {
      case 'import-statement':
        setShowStatementImport(true)
        break
      case 'scan-receipt':
        navigate('/scan-receipt')
        break
      case 'export-data':
        navigate('/settings')
        break
      default:
        break
    }
  }, [navigate])

  // Calculate main content margin
  const mainMarginLeft = isDesktop
    ? sidebarCollapsed
      ? 'var(--sidebar-width-collapsed)'
      : 'var(--sidebar-width-expanded)'
    : '0px'

  return (
    <div className="min-h-screen min-h-dvh bg-[var(--color-bg-base)]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAction={handleAction}
      />

      {/* Main content area */}
      <div
        style={{
          marginLeft: mainMarginLeft,
          minHeight: '100vh',
          transition: 'margin-left var(--transition-sidebar)',
          // Add bottom padding on mobile for bottom nav
          paddingBottom: isMobile ? '80px' : '0px',
        }}
      >
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-20">
                      <Spinner size="lg" />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Command Palette (global) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onAction={handleAction}
      />

      {/* Bottom nav on mobile */}
      {isMobile && <BottomNav />}

      {/* Statement Import Modal */}
      <AnimatePresence>
        {showStatementImport && (
          <Suspense fallback={null}>
            <StatementImport onClose={() => setShowStatementImport(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}
