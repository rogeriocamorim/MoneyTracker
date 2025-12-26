import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById } from '../data/categories'

export default function BudgetForm({ budget = null, onClose }) {
  const { setBudget, state } = useMoney()
  const isEditing = !!budget

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
  })

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
      })
    } else {
      // Find first category without a budget
      const usedCategories = Object.keys(state.budgets)
      const availableCategory = expenseCategories.find(cat => !usedCategories.includes(cat.id))
      if (availableCategory) {
        setFormData(prev => ({ ...prev, category: availableCategory.id }))
      }
    }
  }, [budget, state.budgets])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    setBudget(formData.category, parseFloat(formData.amount))
    toast.success(isEditing ? 'Budget updated' : 'Budget added')
    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectedCategory = getCategoryById(formData.category)
  const usedCategories = Object.keys(state.budgets)
  const availableCategories = expenseCategories.filter(cat => 
    !usedCategories.includes(cat.id) || (budget && budget.category === cat.id)
  )

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="card w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {isEditing ? 'Edit Budget' : 'New Budget'}
              </h2>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {isEditing ? 'Update the budget limit' : 'Set a spending limit for a category'}
              </p>
            </div>
            <button onClick={onClose} className="btn btn-ghost p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isEditing}
                className="input"
                style={{ borderLeft: selectedCategory ? `4px solid ${selectedCategory.color}` : undefined }}
              >
                <option value="">Select category</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {isEditing && (
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Category cannot be changed when editing</p>
              )}
            </div>

            {/* Amount */}
            <div className="text-center py-4 bg-[var(--color-bg-muted)] rounded-xl">
              <label className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">Monthly Limit</label>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-2xl text-[var(--color-text-muted)]">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="text-3xl font-bold font-mono text-center bg-transparent border-none text-[var(--color-accent)] focus:outline-none w-32"
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                    className={`btn ${formData.amount === amount.toString() ? 'btn-primary' : 'btn-secondary'} py-2`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-full py-3">
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? 'Update Budget' : 'Set Budget'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
