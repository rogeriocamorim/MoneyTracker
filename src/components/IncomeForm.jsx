import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { incomeSources } from '../data/categories'

export default function IncomeForm({ income = null, onClose }) {
  const { addIncome, updateIncome } = useMoney()
  const isEditing = !!income

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    source: 'salary',
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
    const data = { ...formData, amount: parseFloat(formData.amount) }
    if (isEditing) {
      updateIncome({ ...data, id: income.id })
      toast.success('Income updated')
    } else {
      addIncome(data)
      toast.success('Income added')
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
                {isEditing ? 'Edit Income' : 'New Income'}
              </h2>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {isEditing ? 'Update the details' : 'Record your earnings'}
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
                  className="text-3xl font-bold font-mono text-center bg-transparent border-none text-[var(--color-success)] focus:outline-none w-32"
                />
              </div>
            </div>

            {/* Date & Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Source</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  {incomeSources.map(source => (
                    <option key={source.id} value={source.id}>{source.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional description"
                className="input"
              />
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-full py-3">
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? 'Update Income' : 'Add Income'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
