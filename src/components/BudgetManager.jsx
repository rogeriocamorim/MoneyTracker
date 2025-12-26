import { useState } from 'react'
import { format } from 'date-fns'
import { PiggyBank, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getBudgetProgress } from '../utils/calculations'
import * as LucideIcons from 'lucide-react'

function CategoryIcon({ categoryId, size = 'w-5 h-5' }) {
  const category = getCategoryById(categoryId)
  if (!category) return null
  const Icon = LucideIcons[category.icon]
  return Icon ? <Icon className={size} style={{ color: category.color }} /> : null
}

export default function BudgetManager() {
  const { state, updateBudget } = useMoney()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [editingCategory, setEditingCategory] = useState(null)
  const [editValue, setEditValue] = useState('')

  // Get monthly expenses
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthlyExpenses = getMonthlyExpenses(state.expenses, monthDate)
  
  // Get budget progress
  const budgetProgress = getBudgetProgress(monthlyExpenses, state.budgets)
  
  // Summary stats
  const totalBudget = Object.values(state.budgets).reduce((sum, b) => sum + b, 0)
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overBudgetCategories = budgetProgress.filter(b => b.spent > b.budget).length

  const handleEditStart = (category) => {
    setEditingCategory(category)
    setEditValue(state.budgets[category]?.toString() || '0')
  }

  const handleEditSave = () => {
    if (editingCategory) {
      updateBudget(editingCategory, parseFloat(editValue) || 0)
      setEditingCategory(null)
      setEditValue('')
    }
  }

  const handleEditCancel = () => {
    setEditingCategory(null)
    setEditValue('')
  }

  const getStatusColor = (percentage, spent, budget) => {
    if (spent > budget) return 'var(--color-danger)'
    if (percentage >= 80) return 'var(--color-warning)'
    return 'var(--color-accent)'
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">Total Budget</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
            {formatCurrency(totalBudget)}
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-danger)]/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-[var(--color-danger)]" />
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">Total Spent</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-danger)]">
            {formatCurrency(totalSpent)}
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-info)]/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[var(--color-info)]" />
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">Remaining</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${totalRemaining >= 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">Over Budget</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-warning)]">
            {overBudgetCategories} {overBudgetCategories === 1 ? 'category' : 'categories'}
          </p>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Click on any budget amount to edit it
        </p>
      </div>

      {/* Budget list */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="divide-y divide-[var(--color-border)]">
          {expenseCategories.map(category => {
            const progress = budgetProgress.find(b => b.category === category.id) || {
              budget: state.budgets[category.id] || 0,
              spent: 0,
              remaining: state.budgets[category.id] || 0,
              percentage: 0,
            }
            const statusColor = getStatusColor(progress.percentage, progress.spent, progress.budget)
            const isEditing = editingCategory === category.id

            return (
              <div
                key={category.id}
                className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  {/* Category icon */}
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <CategoryIcon categoryId={category.id} size="w-5 h-5" />
                  </div>
                  
                  {/* Category name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {category.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {formatCurrency(progress.spent)} of {formatCurrency(progress.budget)}
                    </p>
                  </div>
                  
                  {/* Budget amount (editable) */}
                  <div className="text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 px-3 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono text-sm focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                        <button
                          onClick={handleEditSave}
                          className="px-3 py-1 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-3 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(category.id)}
                        className="font-mono font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {formatCurrency(progress.budget)}
                      </button>
                    )}
                    <p 
                      className="text-sm font-medium mt-1"
                      style={{ color: statusColor }}
                    >
                      {progress.spent > progress.budget 
                        ? `${formatCurrency(Math.abs(progress.remaining))} over`
                        : `${formatCurrency(progress.remaining)} left`
                      }
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, progress.percentage)}%`,
                      backgroundColor: statusColor,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

