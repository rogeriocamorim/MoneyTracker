import { HashRouter, Routes, Route } from 'react-router-dom'
import { MoneyProvider } from './context/MoneyContext'
import Layout from './components/Layout/Layout'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import IncomeList from './components/IncomeList'
import BudgetManager from './components/BudgetManager'
import Settings from './components/Settings'

function App() {
  return (
    <MoneyProvider>
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
    </MoneyProvider>
  )
}

export default App
