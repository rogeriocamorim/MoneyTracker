import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, CreditCard, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, paymentMethods } from '../data/categories'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }
}

export default function ExpenseForm({ expense = null, onClose }) {
  const { addExpense, updateExpense } = useMoney()
  const isEditing = !!expense

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: 'food',
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
    
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    }

    if (isEditing) {
      updateExpense({ ...data, id: expense.id })
      toast.success('Expense updated!')
    } else {
      addExpense(data)
      toast.success('Expense added!')
    }

    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectedCategory = expenseCategories.find(c => c.id === formData.category)

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
                {isEditing ? 'Edit Expense' : 'New Expense'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEditing ? 'Update expense details' : 'Track your spending'}
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
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Amount - Prominent */}
            <div className="text-center py-4">
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Amount
              </label>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl text-[var(--color-text-muted)]">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="text-4xl font-bold font-mono text-center bg-transparent border-none text-[var(--color-danger)] focus:outline-none w-40"
                  style={{ caretColor: 'var(--color-accent)' }}
                />
              </div>
            </div>

            {/* Date & Category Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  style={{ borderLeftColor: selectedCategory?.color, borderLeftWidth: '3px' }}
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(method => {
                  const isSelected = formData.paymentMethod === method.id
                  const Icon = method.id === 'bank' ? Landmark : CreditCard
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      } border`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{method.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What was this for?"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-4 px-6 py-3 rounded-xl btn-primary flex items-center justify-center gap-2"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? 'Update Expense' : 'Add Expense'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
