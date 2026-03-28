import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui'
import { useMoney } from '@/context/MoneyContext'
import { getBudgetProgress, formatCurrency } from '@/utils/calculations'
import { getCategoryById } from '@/data/categories'

export default function BudgetProgressList() {
  const { state } = useMoney()
  const { expenses, budgets, settings, customCategories = [], categoryOverrides = {} } = state
  const currency = settings?.currencySymbol || '$'

  const budgetData = useMemo(() => {
    return getBudgetProgress(expenses, budgets)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
  }, [expenses, budgets])

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Budget Progress</h3>
      {budgetData.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No budgets set</p>
      ) : (
        <div className="space-y-4">
          {budgetData.map((b) => {
            const cat = getCategoryById(b.category, customCategories, categoryOverrides)
            return (
              <ProgressBar
                key={b.category}
                value={b.spent}
                max={b.budget}
                color="auto"
                label={cat?.name || b.category}
                valueLabel={`${formatCurrency(b.spent, currency)} / ${formatCurrency(b.budget, currency)}`}
              />
            )
          })}
        </div>
      )}
    </Card>
  )
}
