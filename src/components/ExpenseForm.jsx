import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Save, Plus } from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, paymentMethods } from '../data/categories'

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
    } else {
      addExpense(data)
    }

    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-md border border-[var(--color-border)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.paymentMethod === method.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {method.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What was this expense for?"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-6 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}

