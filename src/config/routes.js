import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  PieChart,
  Target,
  BarChart3,
  Settings,
} from 'lucide-react'

export const routes = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { path: '/income', label: 'Income', icon: Wallet },
  { path: '/budgets', label: 'Budgets', icon: PieChart },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

export const settingsRoute = { path: '/settings', label: 'Settings', icon: Settings }

export const allRoutes = [...routes, settingsRoute]
