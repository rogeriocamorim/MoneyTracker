import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById } from '../data/categories'
import { formatCurrency } from '../utils/calculations'
import * as LucideIcons from 'lucide-react'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }
}

export default function BudgetForm({ budget = null, onClose }) {
  const { state, updateBudget } = useMoney()
  const isEditing = !!budget

  const [formData, setFormData] = useState({
    category: budget?.category || expenseCategories[0].id,
    amount: '',
  })

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
      })
    }
  }, [budget])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const amount = parseFloat(formData.amount) || 0
    updateBudget(formData.category, amount)
    
    if (isEditing) {
      toast.success('Budget updated!')
    } else {
      toast.success('Budget added!')
    }

    onClose()
  }

  const handleDelete = () => {
    if (confirm('Remove this budget? (Sets to $0)')) {
      updateBudget(formData.category, 0)
      toast.success('Budget removed')
      onClose()
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectedCategory = getCategoryById(formData.category)
  const CategoryIcon = selectedCategory ? LucideIcons[selectedCategory.icon] : null

  // Get categories that don't have a budget yet (for adding new)
  const availableCategories = isEditing 
    ? expenseCategories 
    : expenseCategories.filter(cat => !state.budgets[cat.id] || state.budgets[cat.id] === 0)

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <motion.div 
          className="glass-card rounded-2xl w-full max-w-md shadow-2xl"
          variants={modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {isEditing ? 'Edit Budget' : 'Add Budget'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEditing ? 'Update your monthly limit' : 'Set a monthly spending limit'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Category Selection */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Category
              </label>
              {isEditing ? (
                <div 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                  style={{ borderLeftColor: selectedCategory?.color, borderLeftWidth: '4px' }}
                >
                  {CategoryIcon && <CategoryIcon className="w-5 h-5" style={{ color: selectedCategory?.color }} />}
                  <span className="text-[var(--color-text-primary)] font-medium">{selectedCategory?.name}</span>
                </div>
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  style={{ borderLeftColor: selectedCategory?.color, borderLeftWidth: '4px' }}
                >
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Monthly Budget
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--color-text-muted)]">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-10 pr-4 py-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-2xl font-mono font-bold focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  autoFocus
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Set to $0 to remove the budget
              </p>
            </div>

            {/* Current spending info */}
            {isEditing && budget?.spent > 0 && (
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-muted)]">Currently spent</span>
                  <span className="font-mono font-semibold text-[var(--color-danger)]">
                    {formatCurrency(budget.spent)}
                  </span>
                </div>
                {budget.amount > 0 && (
                  <div className="mt-2">
                    <div className="h-2 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, (budget.spent / budget.amount) * 100)}%`,
                          backgroundColor: budget.spent > budget.amount ? 'var(--color-danger)' : 'var(--color-accent)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-3 rounded-xl bg-[var(--color-danger-muted)] text-[var(--color-danger)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-danger)]/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-xl btn-primary flex items-center justify-center gap-2"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? 'Update Budget' : 'Add Budget'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

