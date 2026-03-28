import { NavLink, useLocation } from 'react-router-dom'
import { routes, settingsRoute } from '@/config/routes'
import { ChevronLeft, Wallet } from 'lucide-react'

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  return (
    <aside
      className={`
        fixed top-0 left-0 z-30 h-screen bg-white border-r border-slate-200
        flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 bg-primary-500 rounded-lg shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-slate-900 whitespace-nowrap">
              Money Tracker
            </span>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {routes.map((route) => {
          const Icon = route.icon
          const isActive = location.pathname === route.path

          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? route.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-500' : ''}`} />
              {!collapsed && <span className="whitespace-nowrap">{route.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom: Settings + Collapse */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-1 shrink-0">
        <NavLink
          to={settingsRoute.path}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-150
            ${location.pathname === settingsRoute.path
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Settings' : undefined}
        >
          <settingsRoute.icon className={`w-5 h-5 shrink-0 ${location.pathname === settingsRoute.path ? 'text-primary-500' : ''}`} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={onToggle}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full
            text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-150 cursor-pointer
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeft className={`w-5 h-5 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
