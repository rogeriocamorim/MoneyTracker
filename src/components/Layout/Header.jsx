import { useLocation } from 'react-router-dom'
import { allRoutes } from '@/config/routes'
import { Menu } from 'lucide-react'

export default function Header({ onMobileMenuToggle }) {
  const location = useLocation()
  const currentRoute = allRoutes.find((r) => r.path === location.pathname)
  const pageTitle = currentRoute?.label || 'Money Tracker'

  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="p-2 mr-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>

      <div className="flex-1" />
    </header>
  )
}
