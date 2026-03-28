import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { useMoney } from '@/context/MoneyContext'
import { formatCurrency, formatCompactCurrency, getTotalByCategory } from '@/utils/calculations'
import { getCategoryById } from '@/data/categories'
import { Card, Select } from '@/components/ui'

export default function ReportsPage() {
  const { state } = useMoney()
  const { expenses, income, settings, customCategories = [], categoryOverrides = {} } = state
  const currency = settings?.currencySymbol || '$'
  const [period, setPeriod] = useState('6')

  const months = Number(period)

  const monthlyData = useMemo(() => {
    const now = new Date()
    const data = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })

      const mIncome = income
        .filter((item) => { const id = new Date(item.date); return id.getMonth() === month && id.getFullYear() === year })
        .reduce((s, item) => s + item.amount, 0)

      const mExpenses = expenses
        .filter((item) => { const id = new Date(item.date); return id.getMonth() === month && id.getFullYear() === year })
        .reduce((s, item) => s + item.amount, 0)

      data.push({ name: label, income: mIncome, expenses: mExpenses, net: mIncome - mExpenses })
    }
    return data
  }, [expenses, income, months])

  const categoryBreakdown = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    const periodExpenses = expenses.filter((e) => new Date(e.date) >= cutoff)
    const byCategory = getTotalByCategory(periodExpenses)

    return Object.entries(byCategory)
      .map(([id, amount]) => {
        const cat = getCategoryById(id, customCategories, categoryOverrides)
        return { name: cat?.name || id, amount, color: cat?.color || '#94a3b8' }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [expenses, months, customCategories, categoryOverrides])

  const totalExpenses = categoryBreakdown.reduce((s, c) => s + c.amount, 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-sm">
        <p className="font-medium text-slate-900 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="font-number" style={{ color: p.color }}>
            {p.dataKey}: {formatCurrency(p.value, currency)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Financial overview</p>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: '3', label: 'Last 3 months' },
            { value: '6', label: 'Last 6 months' },
            { value: '12', label: 'Last 12 months' },
          ]}
          placeholder=""
          size="sm"
          className="w-40"
        />
      </div>

      {/* Income vs Expenses trend */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Income vs Expenses Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 4 }} name="Expenses" />
              <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#6366f1', r: 3 }} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category breakdown */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Spending by Category</h3>
        {categoryBreakdown.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No spending data for this period</p>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const percent = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-slate-700 flex-1 truncate">{cat.name}</span>
                  <span className="text-xs text-slate-400 font-number">{percent.toFixed(1)}%</span>
                  <span className="text-sm font-number font-medium text-slate-900 w-24 text-right">
                    {formatCurrency(cat.amount, currency)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Monthly comparison bars */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v, currency)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} name="Income" />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
