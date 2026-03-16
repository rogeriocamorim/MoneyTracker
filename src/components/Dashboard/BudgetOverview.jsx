import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, EmptyState } from '../ui'
import { getCategoryById } from '../../data/categories'
import { formatCurrency, getBudgetProgress } from '../../utils/calculations'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function BudgetOverview({ budgets, monthlyExpenses, customCategories }) {
  const budgetProgress = useMemo(
    () => getBudgetProgress(monthlyExpenses, budgets),
    [monthlyExpenses, budgets]
  )
  const totalBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0)
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0)

  if (Object.keys(budgets).length === 0) return null

  // Show top 5 budgets sorted by % used descending
  const topBudgets = [...budgetProgress]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)

  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        {/* Overall progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--color-text-muted)]">Overall</span>
            <span className="font-mono text-[var(--color-text-primary)]">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                backgroundColor: totalSpent > totalBudget
                  ? 'var(--color-danger)'
                  : 'var(--color-accent)'
              }}
            />
          </div>
        </div>
        {/* Individual budgets */}
        <div className="space-y-3">
          {topBudgets.map(b => {
            const cat = getCategoryById(b.category, customCategories)
            const isOver = b.spent > b.budget
            const pct = Math.min(b.percentage, 100)
            return (
              <div key={b.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--color-text-primary)] flex items-center gap-1">
                    {cat?.name || b.category}
                    {isOver && <AlertTriangle className="w-3 h-3 text-[var(--color-danger)]" />}
                  </span>
                  <span className="font-mono text-[var(--color-text-muted)]">
                    {b.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver
                        ? 'var(--color-danger)'
                        : b.percentage >= 80
                          ? 'var(--color-warning)'
                          : 'var(--color-accent)'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}
