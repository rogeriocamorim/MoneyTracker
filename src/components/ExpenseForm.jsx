import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, CreditCard, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, paymentMethods, getAllCategories, getCategoryById } from '../data/categories'

export default function ExpenseForm({ expense = null, onClose }) {
  const { state, addExpense, updateExpense } = useMoney()
  const isEditing = !!expense
  
  // Combine predefined and custom categories
  const allCategories = getAllCategories(state.customCategories)

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: allCategories[0]?.id || 'food',
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

            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ borderLeft: `4px solid ${selectedCategory?.color || '#6b7280'}` }}
                >
                  {allCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
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
