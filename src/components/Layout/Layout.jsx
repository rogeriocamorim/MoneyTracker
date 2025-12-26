import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'
import Header from './Header'

const SIDEBAR_WIDTH = 280

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-bg-elevated)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: 'var(--color-bg-elevated)',
            },
          },
        }}
      />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        width={SIDEBAR_WIDTH}
      />
      
      {/* Main content - with left margin on desktop */}
      <div 
        className="min-h-screen transition-[margin] duration-300"
        style={{ marginLeft: 0 }}
      >
        {/* Desktop spacer */}
        <div 
          className="hidden lg:block fixed top-0 left-0 h-full pointer-events-none"
          style={{ width: SIDEBAR_WIDTH }}
        />
        
        {/* Content wrapper with margin on desktop */}
        <div className="lg:pl-[280px]">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        
        {/* Bottom safe area for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}
