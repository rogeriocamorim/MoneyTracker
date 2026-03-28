import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { parseISO } from 'date-fns'
import Card from '@/components/ui/Card'
import { useMoney } from '@/context/MoneyContext'
import { formatCurrency, formatCompactCurrency } from '@/utils/calculations'

export default function CashFlowChart() {
  const { state } = useMoney()
  const { expenses, income, settings } = state
  const currency = settings?.currencySymbol || '$'

  const data = useMemo(() => {
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      const label = d.toLocaleString('en-US', { month: 'short' })

      const monthIncome = income
        .filter((item) => {
          const id = parseISO(item.date)
          return id.getMonth() === month && id.getFullYear() === year
        })
        .reduce((s, item) => s + item.amount, 0)

      const monthExpenses = expenses
        .filter((item) => {
          const id = parseISO(item.date)
          return id.getMonth() === month && id.getFullYear() === year
        })
        .reduce((s, item) => s + item.amount, 0)

      months.push({
        name: label,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      })
    }

    return months
  }, [expenses, income])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-sm">
        <p className="font-medium text-slate-900 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="font-number" style={{ color: p.color }}>
            {p.dataKey === 'income' ? 'Income' : 'Expenses'}: {formatCurrency(p.value, currency)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Cash Flow (6 Months)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactCurrency(v, currency)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} name="Income" />
            <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
