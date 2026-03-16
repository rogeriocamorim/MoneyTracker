import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Save, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { incomeSources } from '../data/categories'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'

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
    e?.preventDefault?.()
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

  const sourceOptions = incomeSources.map(source => ({
    value: source.id,
    label: source.name,
  }))

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Income' : 'New Income'}
      description={isEditing ? 'Update the details' : 'Record your earnings'}
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
            {isEditing ? 'Update Income' : 'Add Income'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" id="income-form">
        {/* Amount */}
        <div className="text-center py-4 bg-[var(--color-bg-muted)] rounded-[var(--radius-xl)]">
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
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="
                w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
                rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
                px-3.5 py-2.5 text-sm
                transition-all duration-[var(--transition-fast)]
                focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
              "
            />
          </div>
          <Select
            label="Source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            options={sourceOptions}
            placeholder=""
          />
        </div>

        {/* Notes */}
        <Input
          label="Notes"
          type="text"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Optional description"
        />
      </form>
    </Modal>
  )
}
