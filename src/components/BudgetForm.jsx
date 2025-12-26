import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById, getAllCategories } from '../data/categories'

// Generate a random color for custom categories
const randomColor = () => {
  const colors = ['#f97316', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#22c55e', '#06b6d4', '#8b5cf6']
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function BudgetForm({ budget = null, onClose }) {
  const { setBudget, addCustomCategory, state } = useMoney()
  const isEditing = !!budget

  const [isCustom, setIsCustom] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
  })

  // Get all categories including custom ones
  const allCategories = getAllCategories(state.customCategories)
  const usedCategories = Object.keys(state.budgets)
  const availableCategories = allCategories.filter(cat => 
    !usedCategories.includes(cat.id) || (budget && budget.category === cat.id)
  )

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
      })
      // Check if it's a custom category
      if (budget.category.startsWith('custom_')) {
        setIsCustom(true)
        const customCat = state.customCategories.find(c => c.id === budget.category)
        setCustomCategoryName(customCat?.name || '')
      }
    } else {
      // Find first available category
      if (availableCategories.length > 0) {
        setFormData(prev => ({ ...prev, category: availableCategories[0].id }))
      }
    }
  }, [budget, state.budgets, state.customCategories])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    let categoryId = formData.category
    
    if (isCustom && !isEditing) {
      if (!customCategoryName.trim()) {
        toast.error('Please enter a category name')
        return
      }
      // Create custom category ID
      categoryId = 'custom_' + customCategoryName.toLowerCase().replace(/\s+/g, '_')
      
      // Add custom category if it doesn't exist
      if (!state.customCategories.some(c => c.id === categoryId)) {
        addCustomCategory({
          id: categoryId,
          name: customCategoryName.trim(),
          color: randomColor()
        })
      }
    }
    
    if (!categoryId) {
      toast.error('Please select a category')
      return
    }
    
    setBudget(categoryId, parseFloat(formData.amount))
    toast.success(isEditing ? 'Budget updated' : 'Budget added')
    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectedCategory = getCategoryById(formData.category, state.customCategories)

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
            {/* Toggle for custom category (only when adding new) */}
            {!isEditing && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className={`btn flex-1 ${!isCustom ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Predefined
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`btn flex-1 ${isCustom ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Edit3 className="w-4 h-4" />
                  Custom
                </button>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Category
              </label>
              {isCustom && !isEditing ? (
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="input"
                />
              ) : (
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
              )}
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
