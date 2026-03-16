import { useState, useEffect } from 'react'
import { Save, Plus, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById, getAllCategories } from '../data/categories'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'

// Generate a random color for custom categories
const randomColor = () => {
  const colors = ['#f97316', '#6366f1', '#eab308', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#22c55e', '#06b6d4', '#8b5cf6']
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
    e?.preventDefault?.()

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Budget' : 'New Budget'}
      description={isEditing ? 'Update the budget limit' : 'Set a spending limit for a category'}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={isEditing ? Save : Plus}
            onClick={handleSubmit}
            className="flex-1"
          >
            {isEditing ? 'Update Budget' : 'Set Budget'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" id="budget-form">
        {/* Toggle for custom category (only when adding new) */}
        {!isEditing && (
          <div className="flex gap-2">
            <Button
              variant={!isCustom ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => setIsCustom(false)}
              type="button"
            >
              Predefined
            </Button>
            <Button
              variant={isCustom ? 'primary' : 'secondary'}
              icon={Edit3}
              className="flex-1"
              onClick={() => setIsCustom(true)}
              type="button"
            >
              Custom
            </Button>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Category
          </label>
          {isCustom && !isEditing ? (
            <Input
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Enter category name..."
            />
          ) : (
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isEditing}
                className="
                  w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
                  rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
                  px-3.5 py-2.5 text-sm appearance-none cursor-pointer
                  transition-all duration-[var(--transition-fast)]
                  focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{ borderLeft: selectedCategory ? `4px solid ${selectedCategory.color}` : undefined }}
              >
                <option value="">Select category</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
          {isEditing && (
            <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Category cannot be changed when editing</p>
          )}
        </div>

        {/* Amount */}
        <div className="text-center py-4 bg-[var(--color-bg-muted)] rounded-[var(--radius-xl)]">
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
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Quick Select
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[100, 250, 500, 1000].map(amount => (
              <Button
                key={amount}
                variant={formData.amount === amount.toString() ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                type="button"
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
