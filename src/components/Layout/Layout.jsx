import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import CommandPalette from '@/components/ui/CommandPalette'
import BottomNav from '@/components/ui/BottomNav'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function Layout() {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), [])
  const toggleMobile = useCallback(() => setMobileOpen((m) => !m), [])

  const sidebarWidth = collapsed ? 72 : 256

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <div
        className={`
          ${isMobile
            ? `fixed z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : ''
          }
        `}
      >
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          onToggle={isMobile ? () => setMobileOpen(false) : toggleCollapse}
        />
      </div>

      {/* Main content */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <Header onMobileMenuToggle={toggleMobile} />
        <main className={`p-4 sm:p-6 ${isMobile ? 'pb-24' : ''}`}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Command palette (Cmd+K) */}
      <CommandPalette />

      {/* Mobile bottom navigation */}
      {isMobile && <BottomNav />}
    </div>
  )
}
