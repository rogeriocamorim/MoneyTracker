import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, CreditCard, Landmark, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, paymentMethods, getAllCategories, getCategoryById } from '../data/categories'

// Random color generator for new categories
const getRandomColor = () => {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899']
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function ExpenseForm({ expense = null, onClose }) {
  const { state, dispatch, addExpense, updateExpense } = useMoney()
  const isEditing = !!expense
  
  // Combine predefined and custom categories
  const allCategories = getAllCategories(state.customCategories)
  
  // Separate budget categories from other categories
  const { budgetCategories, otherCategories } = useMemo(() => {
    const budgetIds = Object.keys(state.budgets)
    const budget = allCategories.filter(cat => budgetIds.includes(cat.id))
    const other = allCategories.filter(cat => !budgetIds.includes(cat.id))
    return { budgetCategories: budget, otherCategories: other }
  }, [allCategories, state.budgets])
  
  // Default to first budget category, or first category overall
  const defaultCategory = budgetCategories[0]?.id || allCategories[0]?.id || 'food'
  
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: defaultCategory,
    description: '',
    paymentMethod: 'bank',
  })

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
      })
    }
  }, [expense])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...formData, amount: parseFloat(formData.amount) }
    if (isEditing) {
      updateExpense({ ...data, id: expense.id })
      toast.success('Expense updated')
    } else {
      addExpense(data)
      toast.success('Expense added')
    }
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
                {isEditing ? 'Edit Expense' : 'New Expense'}
              </h2>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {isEditing ? 'Update the details' : 'Track your spending'}
              </p>
            </div>
            <button onClick={onClose} className="btn btn-ghost p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount */}
            <div className="text-center py-4 bg-[var(--color-bg-muted)] rounded-xl">
              <label className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">Amount</label>
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
                  className="text-3xl font-bold font-mono text-center bg-transparent border-none text-[var(--color-danger)] focus:outline-none w-32"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Category</label>
              {!showAddCategory ? (
                <div className="space-y-2">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="input"
                    style={{ borderLeft: `4px solid ${selectedCategory?.color || '#6b7280'}` }}
                  >
                    {budgetCategories.length > 0 && (
                      <optgroup label="📊 Budget Categories">
                        {budgetCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {otherCategories.length > 0 && (
                      <optgroup label="📁 Other Categories">
                        {otherCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCategory(true)}
                    className="text-[12px] text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> Add new category
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="input"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddCategory(false)
                        setNewCategoryName('')
                      }}
                      className="btn btn-secondary flex-1 text-[13px]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          const newId = newCategoryName.toLowerCase().replace(/\s+/g, '-')
                          const newCategory = {
                            id: newId,
                            name: newCategoryName.trim(),
                            color: getRandomColor()
                          }
                          dispatch({ type: 'ADD_CUSTOM_CATEGORIES', payload: [newCategory] })
                          setFormData(prev => ({ ...prev, category: newId }))
                          setNewCategoryName('')
                          setShowAddCategory(false)
                          toast.success(`Category "${newCategoryName}" added`)
                        }
                      }}
                      disabled={!newCategoryName.trim()}
                      className="btn btn-primary flex-1 text-[13px]"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Payment</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(method => {
                  const isSelected = formData.paymentMethod === method.id
                  const Icon = method.id === 'bank' ? Landmark : CreditCard
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} flex-col gap-1 py-3`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[12px]">{method.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What was this for?"
                className="input"
              />
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-full py-3">
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? 'Update Expense' : 'Add Expense'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
