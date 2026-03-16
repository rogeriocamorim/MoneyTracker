import { motion } from 'framer-motion'
import { TrendingDown } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardHeader, CardTitle, EmptyState } from '../ui'
import { formatCurrency } from '../../utils/calculations'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function ChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-3">
        {payload.map((entry, index) => (
          <p key={index} className="text-[13px] font-mono font-medium" style={{ color: entry.payload.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function CategoryPieChart({ categoryTotals }) {
  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        {categoryTotals.length === 0 ? (
          <EmptyState
            icon={TrendingDown}
            title="No expenses"
            description="No expenses in this period"
          />
        ) : (
          <div style={{ height: 280 }} className="flex items-center">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} strokeWidth={0}>
                    {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-32 space-y-2">
              {categoryTotals.slice(0, 5).map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-[var(--color-text-muted)] truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
