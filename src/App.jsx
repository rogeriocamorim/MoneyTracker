import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { MoneyProvider, useMoney } from './context/MoneyContext'
import Layout from './components/Layout/Layout'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import IncomeList from './components/IncomeList'
import BudgetManager from './components/BudgetManager'
import Settings from './components/Settings'
import Onboarding from './components/Onboarding'

function AppContent() {
  const { state } = useMoney()

  // Show loading state while data is being loaded
  if (!state.isLoaded) {
    return (
      <div className="min-h-screen min-h-dvh bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    )
  }

  // Show onboarding if setup is not complete
  if (!state.setupComplete) {
    return <Onboarding />
  }

  // Show main app
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="income" element={<IncomeList />} />
          <Route path="budget" element={<BudgetManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

function App() {
  return (
    <MoneyProvider>
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
        }}
      />
      <AppContent />
    </MoneyProvider>
  )
}

export default App
