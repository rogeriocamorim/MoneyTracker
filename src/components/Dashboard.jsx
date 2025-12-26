import { useMemo } from 'react'
import { format } from 'date-fns'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById } from '../data/categories'
import { 
  formatCurrency, 
  getMonthlyExpenses, 
  getMonthlyIncome,
  getTotal,
  getTotalByCategory,
  getCombinedTrend,
  getBudgetProgress
} from '../utils/calculations'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg">
        <p className="text-sm text-[var(--color-text-muted)] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-mono font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { state } = useMoney()

  const monthlyExpenses = getMonthlyExpenses(state.expenses)
  const monthlyIncome = getMonthlyIncome(state.income)
  const totalExpenses = getTotal(monthlyExpenses)
  const totalIncome = getTotal(monthlyIncome)
  const savings = totalIncome - totalExpenses
  const totalBudget = Object.values(state.budgets).reduce((sum, b) => sum + b, 0)
  const budgetPercentage = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0
  
  const categoryTotals = useMemo(() => {
    const totals = getTotalByCategory(monthlyExpenses)
    return expenseCategories
      .map(cat => ({
        name: cat.name,
        value: totals[cat.id] || 0,
        color: cat.color,
        id: cat.id,
      }))
      .filter(cat => cat.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [monthlyExpenses])

  const trendData = useMemo(() => 
    getCombinedTrend(state.expenses, state.income, 6),
    [state.expenses, state.income]
  )

  const budgetChartData = useMemo(() => {
    const progress = getBudgetProgress(monthlyExpenses, state.budgets)
    return progress
      .filter(b => b.budget > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(item => ({
        ...item,
        name: getCategoryById(item.category)?.name || item.category,
      }))
  }, [monthlyExpenses, state.budgets])

  const currentMonth = format(new Date(), 'MMMM yyyy')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-4 lg:p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--color-accent)]" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <p className="text-xs lg:text-sm text-[var(--color-text-muted)] mb-1">Income</p>
          <p className="text-xl lg:text-2xl font-bold font-mono text-[var(--color-accent)]">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{currentMonth}</p>
        </div>

        {/* Expenses Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-4 lg:p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--color-danger)]/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--color-danger)]" />
            </div>
            <ArrowDownRight className="w-4 h-4 text-[var(--color-danger)]" />
          </div>
          <p className="text-xs lg:text-sm text-[var(--color-text-muted)] mb-1">Expenses</p>
          <p className="text-xl lg:text-2xl font-bold font-mono text-[var(--color-danger)]">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{currentMonth}</p>
        </div>

        {/* Savings Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-4 lg:p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--color-info)]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--color-info)]" />
            </div>
            {savings >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-[var(--color-accent)]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[var(--color-danger)]" />
            )}
          </div>
          <p className="text-xs lg:text-sm text-[var(--color-text-muted)] mb-1">Savings</p>
          <p className={`text-xl lg:text-2xl font-bold font-mono ${savings >= 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
            {formatCurrency(Math.abs(savings))}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {savings >= 0 ? 'Saved this month' : 'Overspent'}
          </p>
        </div>

        {/* Budget Card */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-4 lg:p-5 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--color-warning)]" />
            </div>
          </div>
          <p className="text-xs lg:text-sm text-[var(--color-text-muted)] mb-1">Budget Used</p>
          <p className="text-xl lg:text-2xl font-bold font-mono text-[var(--color-text-primary)]">
            {budgetPercentage}%
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            of {formatCurrency(totalBudget)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Income vs Expenses
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="shortMonth" 
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <YAxis 
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Expenses"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Expenses by Category
          </h3>
          {categoryTotals.length === 0 ? (
            <div style={{ height: 280 }} className="flex items-center justify-center">
              <p className="text-[var(--color-text-muted)]">No expenses this month</p>
            </div>
          ) : (
            <div style={{ height: 280 }} className="flex">
              <div style={{ flex: 1, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {categoryTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-36 flex flex-col justify-center gap-2 pl-2">
                {categoryTotals.slice(0, 5).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-[var(--color-text-muted)] truncate">
                      {cat.name}
                    </span>
                  </div>
                ))}
                {categoryTotals.length > 5 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    +{categoryTotals.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Budget vs Actual
        </h3>
        {budgetChartData.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-center py-8">
            Set up budgets in the Budget page to see your progress here
          </p>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={budgetChartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  type="number"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="budget" 
                  name="Budget"
                  fill="#2d4038" 
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="spent" 
                  name="Spent"
                  fill="#10b981" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[...monthlyExpenses, ...monthlyIncome.map(i => ({ ...i, isIncome: true }))]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(item => {
              const isIncome = item.isIncome
              const category = isIncome ? null : getCategoryById(item.category)
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: isIncome 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : `${category?.color || '#666'}20`
                      }}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                      ) : (
                        <TrendingDown className="w-4 h-4" style={{ color: category?.color || '#666' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {isIncome ? item.notes || 'Income' : item.description || category?.name || 'Expense'}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {format(new Date(item.date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <p className={`font-mono font-medium ${isIncome ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>
                </div>
              )
            })}
          {monthlyExpenses.length === 0 && monthlyIncome.length === 0 && (
            <p className="text-[var(--color-text-muted)] text-center py-4">
              No transactions yet this month
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
