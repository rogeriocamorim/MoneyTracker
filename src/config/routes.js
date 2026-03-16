import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  GitCompare,
  Settings,
  FileUp,
  ScanLine,
} from 'lucide-react'

/**
 * Single source of truth for all application routes.
 * Consumed by: Sidebar, Header, CommandPalette, BottomNav
 */

export const mainRoutes = [
  {
    path: '/',
    label: 'Dashboard',
    description: 'Overview of your finances',
    icon: LayoutDashboard,
    group: 'main',
    showInBottomNav: true,
  },
  {
    path: '/expenses',
    label: 'Expenses',
    description: 'Track your spending',
    icon: Receipt,
    group: 'main',
    showInBottomNav: true,
  },
  {
    path: '/income',
    label: 'Income',
    description: 'Monitor your earnings',
    icon: Wallet,
    group: 'main',
    showInBottomNav: true,
  },
  {
    path: '/budget',
    label: 'Budget',
    description: 'Manage your budgets',
    icon: PiggyBank,
    group: 'main',
    showInBottomNav: true,
  },
  {
    path: '/compare',
    label: 'Compare',
    description: 'Compare periods',
    icon: GitCompare,
    group: 'tools',
    showInBottomNav: false,
  },
  {
    path: '/settings',
    label: 'Settings',
    description: 'App preferences',
    icon: Settings,
    group: 'tools',
    showInBottomNav: false,
  },
]

export const toolActions = [
  {
    id: 'import-statement',
    label: 'Import Statement',
    description: 'Import bank statements',
    icon: FileUp,
  },
  {
    id: 'scan-receipt',
    label: 'Scan Receipt',
    description: 'Scan a receipt with camera',
    icon: ScanLine,
  },
]

/**
 * Get route config by pathname
 */
export function getRouteByPath(pathname) {
  return mainRoutes.find((r) => r.path === pathname) || null
}

/**
 * Get grouped routes for sidebar sections
 */
export function getGroupedRoutes() {
  const groups = {}
  for (const route of mainRoutes) {
    const group = route.group || 'main'
    if (!groups[group]) groups[group] = []
    groups[group].push(route)
  }
  return groups
}

/**
 * Get routes for bottom navigation
 */
export function getBottomNavRoutes() {
  return mainRoutes.filter((r) => r.showInBottomNav)
}
