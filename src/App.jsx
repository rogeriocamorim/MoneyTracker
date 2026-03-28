import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import { MoneyProvider, useMoney } from '@/context/MoneyContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Layout from '@/components/Layout/Layout'
import { Spinner } from '@/components/ui'

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import('@/components/Dashboard/Dashboard'))
const TransactionsPage = lazy(() => import('@/components/transactions/TransactionsPage'))
const IncomePage = lazy(() => import('@/components/income/IncomePage'))
const BudgetsPage = lazy(() => import('@/components/budgets/BudgetsPage'))
const GoalsPage = lazy(() => import('@/components/goals/GoalsPage'))
const ReportsPage = lazy(() => import('@/components/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'))
const Onboarding = lazy(() => import('@/components/onboarding/Onboarding'))

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )
}

function AppContent() {
  const { state } = useMoney()

  if (!state.isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!state.setupComplete) {
    return (
      <Suspense fallback={<PageSpinner />}>
        <Onboarding />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <MoneyProvider>
          <AppContent />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '0.75rem',
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '0.875rem',
              },
            }}
          />
        </MoneyProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
