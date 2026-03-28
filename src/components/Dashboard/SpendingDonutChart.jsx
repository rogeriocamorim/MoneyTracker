import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '@/components/ui/Card'
import { useMoney } from '@/context/MoneyContext'
import { getTotalByCategory, formatCurrency } from '@/utils/calculations'
import { getCategoryById } from '@/data/categories'

const COLORS = [
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280',
  '#84cc16', '#06b6d4', '#e879f9',
]

export default function SpendingDonutChart() {
  const { state } = useMoney()
  const { expenses, settings } = state
  const currency = settings?.currencySymbol || '$'

  const now = new Date()

  const data = useMemo(() => {
    const byCategory = getTotalByCategory(
      expenses.filter((e) => {
        const d = new Date(e.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
    )

    return Object.entries(byCategory)
      .map(([categoryId, amount]) => {
        const cat = getCategoryById(categoryId)
        return { name: cat?.name || categoryId, value: amount, id: categoryId }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [expenses])

  const total = data.reduce((s, d) => s + d.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-sm">
        <p className="font-medium text-slate-900">{d.name}</p>
        <p className="font-number text-slate-600">{formatCurrency(d.value, currency)}</p>
        <p className="text-xs text-slate-400">{((d.value / total) * 100).toFixed(1)}%</p>
      </div>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Spending by Category</h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No expenses this month</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {data.slice(0, 6).map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-600 truncate flex-1">{item.name}</span>
                <span className="font-number text-slate-900 font-medium">
                  {formatCurrency(item.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
