import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Target, AlertTriangle, CheckCircle, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getCategoryById, getAllCategories } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getBudgetProgress } from '../utils/calculations'
import * as LucideIcons from 'lucide-react'
import BudgetForm from './BudgetForm'

function CategoryIcon({ categoryId, customCategories }) {
  const category = getCategoryById(categoryId, customCategories)
  if (!category) return null
  const Icon = LucideIcons[category.icon] || Tag
  return Icon ? <Icon className="w-5 h-5" style={{ color: category.color }} /> : null
}

function ProgressBar({ spent, budget }) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const isOver = spent > budget
  const isWarning = percentage >= 80 && !isOver
  
  let color = 'var(--color-accent)'
  if (isOver) color = 'var(--color-danger)'
  else if (isWarning) color = 'var(--color-warning)'
  
  return (
    <div className="h-2 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function BudgetManager() {
  const { state, removeBudget } = useMoney()
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)

  const monthlyExpenses = getMonthlyExpenses(state.expenses)
  const budgetProgress = useMemo(() => getBudgetProgress(monthlyExpenses, state.budgets), [monthlyExpenses, state.budgets])

  const totalBudget = Object.values(state.budgets).reduce((sum, b) => sum + b, 0)
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const handleEdit = (categoryId) => {
    setEditingBudget({ category: categoryId, amount: state.budgets[categoryId] || 0 })
    setShowForm(true)
  }

  const handleDelete = (categoryId) => {
    if (confirm('Remove this budget?')) {
      removeBudget(categoryId)
      toast.success('Budget removed')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

  const handleAddNew = () => {
    setEditingBudget(null)
    setShowForm(true)
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)]">Total Budget</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-accent)]">{formatCurrency(totalBudget)}</p>
        </div>
        <button onClick={handleAddNew} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Budget
        </button>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Monthly Overview</h3>
          <span className={`badge ${overallPercentage >= 100 ? 'badge-danger' : overallPercentage >= 80 ? 'badge-warning' : 'badge-success'}`}>
            {overallPercentage.toFixed(2)}% used
          </span>
        </div>
        <ProgressBar spent={totalSpent} budget={totalBudget} />
        <div className="flex justify-between mt-3 text-[13px]">
          <span className="text-[var(--color-text-muted)]">Spent: <span className="font-mono text-[var(--color-danger)]">{formatCurrency(totalSpent)}</span></span>
          <span className="text-[var(--color-text-muted)]">Remaining: <span className="font-mono text-[var(--color-success)]">{formatCurrency(Math.max(0, totalBudget - totalSpent))}</span></span>
        </div>
      </div>

      {/* Budget List */}
      <div className="card" style={{ padding: 0 }}>
        {budgetProgress.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-muted)] flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] mb-2">No budgets set</p>
            <p className="text-[13px] text-[var(--color-text-muted)]">Click "Add Budget" to get started</p>
          </div>
        ) : (
          <div>
            {budgetProgress.map((item, i) => {
              const category = getCategoryById(item.category, state.customCategories)
              const isOver = item.spent > item.budget
              const isWarning = item.percentage >= 80 && !isOver
              
              return (
                <div key={item.category} className={`p-4 group ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${category?.color || '#6b7280'}15` }}>
                      <CategoryIcon categoryId={item.category} customCategories={state.customCategories} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--color-text-primary)]">{category?.name || item.category}</p>
                        {isOver && <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />}
                        {!isOver && item.percentage < 50 && <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[13px]">
                        <span className={isOver ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}>
                          {formatCurrency(item.spent)}
                        </span>
                        <span className="text-[var(--color-text-muted)]">of</span>
                        <span className="text-[var(--color-accent)]">{formatCurrency(item.budget)}</span>
                      </div>
                    </div>
                    <span className={`font-mono font-semibold ${isOver ? 'text-[var(--color-danger)]' : isWarning ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                      {item.percentage.toFixed(2)}%
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item.category)} className="btn btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.category)} className="btn btn-danger p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <ProgressBar spent={item.spent} budget={item.budget} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>{showForm && <BudgetForm budget={editingBudget} onClose={handleCloseForm} />}</AnimatePresence>
    </motion.div>
  )
}
