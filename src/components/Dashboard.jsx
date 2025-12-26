import { useMemo } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
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
  Legend,
  Area,
  AreaChart
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
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl p-3 shadow-xl">
        <p className="text-xs text-[var(--color-text-muted)] mb-2">{label}</p>
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

function StatCard({ icon: Icon, label, value, trend, color, gradient }) {
  const isPositive = trend === 'up'
  
  return (
    <motion.div 
      variants={item}
      className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group"
    >
      {/* Gradient glow effect */}
      <div 
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-20 blur-2xl"
        style={{ background: gradient }}
      />
      
      <div className="flex items-center gap-3 sm:gap-0 sm:flex-col sm:items-start relative">
        <div className="flex items-center justify-between w-full sm:mb-3">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium sm:absolute sm:top-0 sm:right-0 ${
              isPositive ? 'bg-[var(--color-success-muted)] text-[var(--color-success)]' : 'bg-[var(--color-danger-muted)] text-[var(--color-danger)]'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </div>
          )}
        </div>
        
        <div className="flex-1 sm:flex-none">
          <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-lg sm:text-2xl font-bold font-mono" style={{ color }}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )
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
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          label="Income"
          value={formatCurrency(totalIncome)}
          trend="up"
          color="#4ade80"
          gradient="var(--gradient-success)"
        />
        <StatCard
          icon={TrendingDown}
          label="Expenses"
          value={formatCurrency(totalExpenses)}
          trend="down"
          color="#f87171"
          gradient="var(--gradient-danger)"
        />
        <StatCard
          icon={Wallet}
          label="Savings"
          value={formatCurrency(Math.abs(savings))}
          trend={savings >= 0 ? 'up' : 'down'}
          color={savings >= 0 ? '#4ade80' : '#f87171'}
          gradient={savings >= 0 ? 'var(--gradient-success)' : 'var(--gradient-danger)'}
        />
        <StatCard
          icon={Target}
          label="Budget Used"
          value={`${budgetPercentage}%`}
          color="#22d3ee"
          gradient="var(--gradient-accent)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Income vs Expenses Trend */}
        <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
            <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
              Cash Flow Trend
            </h3>
          </div>
          <div style={{ width: '100%', height: 220 }} className="sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="shortMonth" 
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="#4ade80" 
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                  dot={{ fill: '#4ade80', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#4ade80' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Expenses"
                  stroke="#f87171" 
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                  dot={{ fill: '#f87171', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#f87171' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] mb-4 sm:mb-6">
            Spending Breakdown
          </h3>
          {categoryTotals.length === 0 ? (
            <div style={{ height: 200 }} className="sm:h-[260px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center mb-4">
                <TrendingDown className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[var(--color-text-muted)] text-sm">No expenses this month</p>
              <p className="text-[var(--color-text-muted)] text-xs mt-1">Add expenses to see breakdown</p>
            </div>
          ) : (
            <div style={{ height: 260 }} className="flex">
              <div style={{ flex: 1, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {categoryTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 flex flex-col justify-center gap-2">
                {categoryTotals.slice(0, 4).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-[var(--color-text-muted)] truncate">
                      {cat.name}
                    </span>
                  </div>
                ))}
                {categoryTotals.length > 4 && (
                  <p className="text-xs text-[var(--color-text-muted)] pl-4">
                    +{categoryTotals.length - 4} more
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Budget Progress */}
      <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] mb-4 sm:mb-6">
          Budget Progress
        </h3>
        {budgetChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">No budgets set</p>
            <p className="text-[var(--color-text-muted)] text-xs mt-1">Go to Budget page to set up your limits</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={budgetChartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis 
                  type="number"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  width={75}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                <Bar 
                  dataKey="budget" 
                  name="Budget"
                  fill="rgba(255,255,255,0.1)" 
                  radius={[0, 6, 6, 0]}
                />
                <Bar 
                  dataKey="spent" 
                  name="Spent"
                  fill="#22d3ee" 
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] mb-3 sm:mb-4">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {[...monthlyExpenses, ...monthlyIncome.map(i => ({ ...i, isIncome: true }))]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map((transaction, index) => {
              const isIncome = transaction.isIncome
              const category = isIncome ? null : getCategoryById(transaction.category)
              
              return (
                <motion.div 
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: isIncome 
                          ? 'rgba(74, 222, 128, 0.1)' 
                          : `${category?.color || '#666'}15`
                      }}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: category?.color || '#666' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {isIncome ? transaction.notes || 'Income' : transaction.description || category?.name || 'Expense'}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className={`font-mono font-semibold ${isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </motion.div>
              )
            })}
          {monthlyExpenses.length === 0 && monthlyIncome.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[var(--color-text-muted)] text-sm">No transactions yet</p>
              <p className="text-[var(--color-text-muted)] text-xs mt-1">Start by adding an expense or income</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
