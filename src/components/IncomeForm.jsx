import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Save, Plus } from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { incomeSources } from '../data/categories'

export default function IncomeForm({ income = null, onClose }) {
  const { addIncome, updateIncome } = useMoney()
  const isEditing = !!income

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    source: 'daily_job',
    notes: '',
  })

  useEffect(() => {
    if (income) {
      setFormData({
        date: income.date,
        amount: income.amount.toString(),
        source: income.source,
        notes: income.notes || '',
      })
    }
  }, [income])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    }

    if (isEditing) {
      updateIncome({ ...data, id: income.id })
    } else {
      addIncome(data)
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
            {isEditing ? 'Edit Income' : 'Add Income'}
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

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Income Source
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              {incomeSources.map(source => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Notes
            </label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes about this income"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-6 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEditing ? 'Save Changes' : 'Add Income'}
          </button>
        </form>
      </div>
    </div>
  )
}

