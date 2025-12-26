import { useMemo } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  AreaChart,
  Area,
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function StatCard({ icon: Icon, label, value, trend, color, bgColor }) {
  const isUp = trend === 'up'
  
  return (
    <motion.div variants={item} className="card">
      <div className="flex items-center justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend && (
          <span className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono" style={{ color }}>{value}</p>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card card-compact" style={{ padding: '12px 16px' }}>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[13px] font-mono font-medium" style={{ color: entry.color }}>
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
      .map(cat => ({ name: cat.name, value: totals[cat.id] || 0, color: cat.color, id: cat.id }))
      .filter(cat => cat.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [monthlyExpenses])

  const trendData = useMemo(() => getCombinedTrend(state.expenses, state.income, 6), [state.expenses, state.income])

  const budgetChartData = useMemo(() => {
    const progress = getBudgetProgress(monthlyExpenses, state.budgets)
    return progress
      .filter(b => b.budget > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(item => ({ ...item, name: getCategoryById(item.category)?.name || item.category }))
  }, [monthlyExpenses, state.budgets])

  const currentMonth = format(new Date(), 'MMMM yyyy')

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Income"
          value={formatCurrency(totalIncome)}
          trend="up"
          color="var(--color-success)"
          bgColor="var(--color-success-muted)"
        />
        <StatCard
          icon={TrendingDown}
          label="Expenses"
          value={formatCurrency(totalExpenses)}
          trend="down"
          color="var(--color-danger)"
          bgColor="var(--color-danger-muted)"
        />
        <StatCard
          icon={Wallet}
          label="Savings"
          value={formatCurrency(Math.abs(savings))}
          trend={savings >= 0 ? 'up' : 'down'}
          color={savings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          bgColor={savings >= 0 ? 'var(--color-success-muted)' : 'var(--color-danger-muted)'}
        />
        <StatCard
          icon={Target}
          label="Budget Used"
          value={`${budgetPercentage}%`}
          color="var(--color-accent)"
          bgColor="var(--color-accent-muted)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <motion.div variants={item} className="card">
          <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-6">
            Cash Flow Trend
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-danger)" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 16 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="var(--color-success)" strokeWidth={2} fill="url(#incomeGradient)" dot={false} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-danger)" strokeWidth={2} fill="url(#expenseGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={item} className="card">
          <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-6">
            Spending by Category
          </h3>
          {categoryTotals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-muted)] flex items-center justify-center mb-4">
                <TrendingDown className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[var(--color-text-muted)]">No expenses this month</p>
            </div>
          ) : (
            <div style={{ height: 280 }} className="flex items-center">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={categoryTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} strokeWidth={0}>
                      {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 space-y-2">
                {categoryTotals.slice(0, 5).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[12px] text-[var(--color-text-muted)] truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Budget Progress */}
      <motion.div variants={item} className="card">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-6">
          Budget Progress
        </h3>
        {budgetChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-muted)] flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)]">No budgets set yet</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={budgetChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 16 }} />
                <Bar dataKey="budget" name="Budget" fill="var(--color-bg-hover)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="spent" name="Spent" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item} className="card">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-4">
          Recent Activity
        </h3>
        <div className="space-y-1">
          {[...monthlyExpenses, ...monthlyIncome.map(i => ({ ...i, isIncome: true }))]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(tx => {
              const isIncome = tx.isIncome
              const category = isIncome ? null : getCategoryById(tx.category)
              return (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: isIncome ? 'var(--color-success-muted)' : `${category?.color}20` }}>
                    {isIncome ? <TrendingUp className="w-5 h-5 text-[var(--color-success)]" /> : <TrendingDown className="w-5 h-5" style={{ color: category?.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                      {isIncome ? tx.notes || 'Income' : tx.description || category?.name}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                  </div>
                  <p className={`font-mono font-semibold ${isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              )
            })}
          {monthlyExpenses.length === 0 && monthlyIncome.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-muted)]">No transactions yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
