import { useState, useMemo } from 'react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { useMoney } from '../context/MoneyContext'
import { getCategoryById, getAllCategories } from '../data/categories'
import { formatCurrency, getTotal, getTotalByCategory } from '../utils/calculations'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// Get expenses for a specific month
function getExpensesForMonth(expenses, date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return expenses.filter(e => {
    const expenseDate = parseISO(e.date)
    return isWithinInterval(expenseDate, { start, end })
  })
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

export default function Compare() {
  const { state } = useMoney()
  const [monthsToCompare, setMonthsToCompare] = useState(3)
  const [startMonth, setStartMonth] = useState(0) // 0 = current month
  
  const allCategories = getAllCategories(state.customCategories)

  // Generate month data for comparison
  const monthlyData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = startMonth + monthsToCompare - 1; i >= startMonth; i--) {
      const monthDate = subMonths(now, i)
      const monthExpenses = getExpensesForMonth(state.expenses, monthDate)
      const categoryTotals = getTotalByCategory(monthExpenses)
      const total = getTotal(monthExpenses)
      
      data.push({
        month: format(monthDate, 'MMM yyyy'),
        shortMonth: format(monthDate, 'MMM'),
        date: monthDate,
        total,
        categories: categoryTotals,
        expenses: monthExpenses,
      })
    }
    
    return data
  }, [state.expenses, monthsToCompare, startMonth])

  // Get all categories that have expenses in any of the compared months
  const activeCategories = useMemo(() => {
    const categoryIds = new Set()
    monthlyData.forEach(month => {
      Object.keys(month.categories).forEach(catId => {
        if (month.categories[catId] > 0) categoryIds.add(catId)
      })
    })
    return allCategories.filter(cat => categoryIds.has(cat.id))
  }, [monthlyData, allCategories])

  // Prepare chart data for category comparison
  const categoryChartData = useMemo(() => {
    return activeCategories.map(cat => {
      const row = { name: cat.name, color: cat.color }
      monthlyData.forEach(month => {
        row[month.shortMonth] = month.categories[cat.id] || 0
      })
      return row
    }).sort((a, b) => {
      const totalA = monthlyData.reduce((sum, m) => sum + (a[m.shortMonth] || 0), 0)
      const totalB = monthlyData.reduce((sum, m) => sum + (b[m.shortMonth] || 0), 0)
      return totalB - totalA
    })
  }, [activeCategories, monthlyData])

  // Prepare total trend data
  const trendData = useMemo(() => {
    return monthlyData.map(month => ({
      month: month.shortMonth,
      total: month.total,
    }))
  }, [monthlyData])

  // Calculate month-over-month changes
  const monthChanges = useMemo(() => {
    if (monthlyData.length < 2) return []
    
    const changes = []
    for (let i = 1; i < monthlyData.length; i++) {
      const current = monthlyData[i]
      const previous = monthlyData[i - 1]
      const diff = current.total - previous.total
      const percentChange = previous.total > 0 ? ((diff / previous.total) * 100) : 0
      
      changes.push({
        from: previous.shortMonth,
        to: current.shortMonth,
        diff,
        percentChange,
      })
    }
    return changes
  }, [monthlyData])

  const handlePrevious = () => setStartMonth(prev => prev + 1)
  const handleNext = () => setStartMonth(prev => Math.max(0, prev - 1))

  // Colors for the chart bars
  const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Compare Expenses</h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Analyze spending patterns across months
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevious}
            className="btn btn-secondary p-2"
            title="Earlier months"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <select 
            value={monthsToCompare}
            onChange={(e) => setMonthsToCompare(Number(e.target.value))}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
          
          <button 
            onClick={handleNext}
            disabled={startMonth === 0}
            className="btn btn-secondary p-2"
            title="Recent months"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Monthly Totals Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {monthlyData.map((month, i) => {
          const prevMonth = monthlyData[i - 1]
          const diff = prevMonth ? month.total - prevMonth.total : 0
          const isUp = diff > 0
          const isDown = diff < 0
          
          return (
            <div key={month.month} className="card text-center">
              <p className="text-[12px] text-[var(--color-text-muted)] mb-1">{month.month}</p>
              <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                {formatCurrency(month.total)}
              </p>
              {prevMonth && (
                <div className={`flex items-center justify-center gap-1 mt-1 text-[11px] ${isUp ? 'text-[var(--color-danger)]' : isDown ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : isDown ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  <span>{Math.abs(diff) > 0 ? formatCurrency(Math.abs(diff)) : '-'}</span>
                </div>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Total Trend Chart */}
      <motion.div variants={item} className="card">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-6">
          Total Spending Trend
        </h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Total Spent"
                stroke="var(--color-accent)" 
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7, fill: 'var(--color-accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Comparison Chart */}
      <motion.div variants={item} className="card">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-6">
          Category Comparison
        </h3>
        {categoryChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-muted)] flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)]">No expense data for selected period</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: Math.max(300, categoryChartData.length * 50) }}>
            <ResponsiveContainer>
              <BarChart 
                data={categoryChartData} 
                layout="vertical" 
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="var(--color-text-muted)" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={v => `$${v}`} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="var(--color-text-muted)" 
                  tick={{ fontSize: 12 }} 
                  width={120} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 16 }} />
                {monthlyData.map((month, i) => (
                  <Bar 
                    key={month.shortMonth}
                    dataKey={month.shortMonth} 
                    name={month.month}
                    fill={barColors[i % barColors.length]} 
                    radius={[0, 4, 4, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Category Table */}
      <motion.div variants={item} className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Detailed Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-bg-muted)]">
                <th className="text-left p-3 text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Category
                </th>
                {monthlyData.map(month => (
                  <th key={month.month} className="text-right p-3 text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {month.shortMonth}
                  </th>
                ))}
                <th className="text-right p-3 text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Avg
                </th>
                <th className="text-right p-3 text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCategories.map((cat, i) => {
                const values = monthlyData.map(m => m.categories[cat.id] || 0)
                const avg = values.reduce((a, b) => a + b, 0) / values.length
                const firstVal = values[0] || 0
                const lastVal = values[values.length - 1] || 0
                const trend = lastVal - firstVal
                const trendPercent = firstVal > 0 ? ((trend / firstVal) * 100) : 0
                
                return (
                  <tr key={cat.id} className={`${i !== 0 ? 'border-t border-[var(--color-border)]' : ''} hover:bg-[var(--color-bg-hover)]`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[14px] text-[var(--color-text-primary)]">{cat.name}</span>
                      </div>
                    </td>
                    {values.map((val, j) => (
                      <td key={j} className="p-3 text-right font-mono text-[13px] text-[var(--color-text-primary)]">
                        {val > 0 ? formatCurrency(val) : '-'}
                      </td>
                    ))}
                    <td className="p-3 text-right font-mono text-[13px] text-[var(--color-accent)]">
                      {formatCurrency(avg)}
                    </td>
                    <td className="p-3 text-right">
                      <div className={`flex items-center justify-end gap-1 text-[12px] ${trend > 0 ? 'text-[var(--color-danger)]' : trend < 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        <span>{trend !== 0 ? `${trendPercent.toFixed(0)}%` : '-'}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {/* Totals Row */}
              <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-bg-muted)] font-semibold">
                <td className="p-3 text-[14px] text-[var(--color-text-primary)]">Total</td>
                {monthlyData.map(month => (
                  <td key={month.month} className="p-3 text-right font-mono text-[13px] text-[var(--color-text-primary)]">
                    {formatCurrency(month.total)}
                  </td>
                ))}
                <td className="p-3 text-right font-mono text-[13px] text-[var(--color-accent)]">
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length)}
                </td>
                <td className="p-3 text-right">
                  {monthlyData.length >= 2 && (
                    <div className={`flex items-center justify-end gap-1 text-[12px] ${
                      monthlyData[monthlyData.length - 1].total > monthlyData[0].total 
                        ? 'text-[var(--color-danger)]' 
                        : 'text-[var(--color-success)]'
                    }`}>
                      {monthlyData[monthlyData.length - 1].total > monthlyData[0].total 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />
                      }
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}

