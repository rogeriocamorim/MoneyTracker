import { subMonths } from 'date-fns'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { useMoney } from '@/context/MoneyContext'
import {
  formatCurrency,
  getMonthlyExpenses,
  getMonthlyIncome,
  getTotal,
  getPercentChange,
} from '@/utils/calculations'

export default function StatCardsGrid() {
  const { state } = useMoney()
  const { expenses, income, settings } = state

  const now = new Date()
  const lastMonthDate = subMonths(now, 1)

  const thisMonthExpenses = getTotal(getMonthlyExpenses(expenses, now))
  const prevMonthExpenses = getTotal(getMonthlyExpenses(expenses, lastMonthDate))
  const thisMonthIncome = getTotal(getMonthlyIncome(income, now))
  const prevMonthIncome = getTotal(getMonthlyIncome(income, lastMonthDate))

  const totalIncome = getTotal(income)
  const totalExpenses = getTotal(expenses)
  const netWorth = totalIncome - totalExpenses

  const expenseTrend = getPercentChange(thisMonthExpenses, prevMonthExpenses)
  const incomeTrend = getPercentChange(thisMonthIncome, prevMonthIncome)

  const sym = settings?.currencySymbol || '$'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Net Worth"
        value={formatCurrency(netWorth, sym)}
        icon={DollarSign}
        iconColor="text-primary-500"
        iconBg="bg-primary-50"
      />
      <StatCard
        label="Monthly Income"
        value={formatCurrency(thisMonthIncome, sym)}
        icon={TrendingUp}
        trend={isFinite(incomeTrend) ? incomeTrend : null}
        trendLabel="vs last month"
        iconColor="text-success-500"
        iconBg="bg-success-50"
      />
      <StatCard
        label="Monthly Spending"
        value={formatCurrency(thisMonthExpenses, sym)}
        icon={TrendingDown}
        trend={isFinite(expenseTrend) ? expenseTrend : null}
        trendLabel="vs last month"
        iconColor="text-danger-500"
        iconBg="bg-danger-50"
      />
    </div>
  )
}
