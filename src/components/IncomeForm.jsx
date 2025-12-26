import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { incomeSources } from '../data/categories'
import * as LucideIcons from 'lucide-react'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }
}

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
      toast.success('Income updated!')
    } else {
      addIncome(data)
      toast.success('Income added!')
    }

    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
                {isEditing ? 'Edit Income' : 'New Income'}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEditing ? 'Update income details' : 'Record your earnings'}
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
                  className="text-4xl font-bold font-mono text-center bg-transparent border-none text-[var(--color-success)] focus:outline-none w-40"
                  style={{ caretColor: 'var(--color-accent)' }}
                />
              </div>
            </div>

            {/* Date */}
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

            {/* Income Source */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                {incomeSources.map(source => {
                  const isSelected = formData.source === source.id
                  const Icon = LucideIcons[source.icon] || LucideIcons.Wallet
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, source: source.id }))}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--color-success-muted)] text-[var(--color-success)] border-[var(--color-success)]'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      } border`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{source.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Notes
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional description"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-4 px-6 py-3 rounded-xl btn-primary flex items-center justify-center gap-2"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? 'Update Income' : 'Add Income'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
