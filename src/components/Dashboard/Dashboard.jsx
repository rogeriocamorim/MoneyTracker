import { useState, useMemo } from 'react'
import { parseISO, endOfMonth } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useMoney } from '../../context/MoneyContext'
import { getAllCategories } from '../../data/categories'
import {
  getTotal,
  getTotalByCategory,
  getCombinedTrend,
  getDateRangeForPeriod,
  filterByDateRange,
  getPeriodLabel,
  getMonthlyExpenses
} from '../../utils/calculations'
import CategoryExpensesModal from '../CategoryExpensesModal'
import DashboardHeader from './DashboardHeader'
import StatCardsGrid from './StatCardsGrid'
import CashFlowChart from './CashFlowChart'
import CategoryPieChart from './CategoryPieChart'
import CategorySpendingList from './CategorySpendingList'
import BudgetOverview from './BudgetOverview'
import RecentActivity from './RecentActivity'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

export default function Dashboard() {
  const { state } = useMoney()
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [customRange, setCustomRange] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Get date range for selected period
  const dateRange = useMemo(() => {
    if (selectedPeriod === 'custom' && customRange) {
      return {
        start: parseISO(customRange.start),
        end: endOfMonth(parseISO(customRange.end))
      }
    }
    return getDateRangeForPeriod(selectedPeriod)
  }, [selectedPeriod, customRange])

  // Filter data by selected period
  const filteredExpenses = useMemo(
    () => filterByDateRange(state.expenses, dateRange),
    [state.expenses, dateRange]
  )
  const filteredIncome = useMemo(
    () => filterByDateRange(state.income, dateRange),
    [state.income, dateRange]
  )

  const totalExpenses = getTotal(filteredExpenses)
  const totalIncome = getTotal(filteredIncome)
  const savings = totalIncome - totalExpenses
  const totalBudget = Object.values(state.budgets).reduce((sum, b) => sum + b, 0)

  // Calculate budget usage - for periods other than "this month", show average monthly spending
  const monthsInPeriod = useMemo(() => {
    if (selectedPeriod === 'custom' && customRange) {
      const start = parseISO(customRange.start)
      const end = parseISO(customRange.end)
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      return Math.max(1, Math.round(diffDays / 30))
    }
    switch (selectedPeriod) {
      case 'this_month':
      case 'last_month':
        return 1
      case 'last_3_months':
        return 3
      case 'last_6_months':
        return 6
      case 'this_year':
        return new Date().getMonth() + 1
      case 'all_time':
        return Math.max(1, Math.ceil((new Date() - new Date(Math.min(...state.expenses.map(e => new Date(e.date))))) / (1000 * 60 * 60 * 24 * 30)))
      default:
        return 1
    }
  }, [selectedPeriod, customRange, state.expenses])

  const avgMonthlyExpenses = totalExpenses / monthsInPeriod
  const budgetPercentage = totalBudget > 0 ? Math.round((avgMonthlyExpenses / totalBudget) * 100) : 0

  const allCategories = getAllCategories(state.customCategories)

  const categoryTotals = useMemo(() => {
    const totals = getTotalByCategory(filteredExpenses)
    return allCategories
      .map(cat => ({ name: cat.name, value: totals[cat.id] || 0, color: cat.color, id: cat.id, icon: cat.icon }))
      .filter(cat => cat.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, allCategories])

  // Trend chart shows data based on period
  const trendMonths = useMemo(() => {
    if (selectedPeriod === 'custom' && customRange) {
      const start = parseISO(customRange.start)
      const end = parseISO(customRange.end)
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      return Math.min(12, Math.max(3, Math.round(diffDays / 30)))
    }
    switch (selectedPeriod) {
      case 'this_month':
      case 'last_month':
        return 3
      case 'last_3_months':
        return 3
      case 'last_6_months':
        return 6
      case 'this_year':
        return 12
      case 'all_time':
        return 12
      default:
        return 6
    }
  }, [selectedPeriod, customRange])

  const trendData = useMemo(
    () => getCombinedTrend(state.expenses, state.income, trendMonths),
    [state.expenses, state.income, trendMonths]
  )

  const periodLabel = getPeriodLabel(selectedPeriod, customRange)

  // Monthly expenses for BudgetOverview (current month only)
  const monthlyExpenses = useMemo(
    () => getMonthlyExpenses(state.expenses),
    [state.expenses]
  )

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <DashboardHeader
        periodLabel={periodLabel}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      <StatCardsGrid
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        savings={savings}
        budgetPercentage={budgetPercentage}
        periodLabel={selectedPeriod === 'this_month' ? 'Budget Used' : 'Avg Budget/Mo'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart trendData={trendData} />
        <CategoryPieChart categoryTotals={categoryTotals} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CategorySpendingList
            categoryTotals={categoryTotals}
            totalExpenses={totalExpenses}
            onCategoryClick={setSelectedCategory}
          />
        </div>
        <BudgetOverview
          budgets={state.budgets}
          monthlyExpenses={monthlyExpenses}
          customCategories={state.customCategories}
        />
      </div>

      <RecentActivity
        filteredExpenses={filteredExpenses}
        filteredIncome={filteredIncome}
        customCategories={state.customCategories}
      />

      <AnimatePresence>
        {selectedCategory && (
          <CategoryExpensesModal
            category={selectedCategory}
            expenses={filteredExpenses}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
