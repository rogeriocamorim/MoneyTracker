import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Card, CardHeader, CardTitle, EmptyState } from '../ui'
import { formatCurrency } from '../../utils/calculations'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function CategorySpendingList({ categoryTotals, totalExpenses, onCategoryClick }) {
  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <span className="text-xs text-[var(--color-text-muted)]">
            {categoryTotals.length} {categoryTotals.length === 1 ? 'category' : 'categories'}
          </span>
        </CardHeader>
        {categoryTotals.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No expenses"
            description="No expenses in this period"
          />
        ) : (
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {categoryTotals.map(cat => {
              const Icon = LucideIcons[cat.icon] || Tag
              const percentage = totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                  onClick={() => onCategoryClick(cat)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">{cat.name}</p>
                      <p className="font-mono font-semibold text-[var(--color-danger)]">
                        {formatCurrency(cat.value)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <span className="text-[11px] text-[var(--color-text-muted)] w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
