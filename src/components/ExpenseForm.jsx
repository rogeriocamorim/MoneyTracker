import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Save, Plus, CreditCard, Landmark, PlusCircle, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, paymentMethods, getAllCategories, getCategoryById } from '../data/categories'
import ReceiptScanner from './ReceiptScanner'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'

// Random color generator for new categories
const getRandomColor = () => {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899']
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
  const [showReceiptScanner, setShowReceiptScanner] = useState(false)

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

  const handleReceiptData = (data) => {
    setFormData(prev => ({
      ...prev,
      amount: data.total ? data.total.toString() : prev.amount,
      date: data.date || prev.date,
      paymentMethod: data.paymentMethod || prev.paymentMethod,
      description: data.description || prev.description,
    }))
  }

  const selectedCategory = getCategoryById(formData.category, state.customCategories)

  const headerActions = !isEditing ? (
    <Button
      variant="secondary"
      size="sm"
      className="p-1.5"
      onClick={() => setShowReceiptScanner(true)}
      title="Scan Receipt"
    >
      <Receipt className="w-5 h-5" />
    </Button>
  ) : null

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditing ? 'Edit Expense' : 'New Expense'}
        description={isEditing ? 'Update the details' : 'Track your spending'}
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
              {isEditing ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        }
      >
        {/* Receipt Scanner Button (for new expenses) */}
        {!isEditing && (
          <div className="flex justify-end -mt-2 mb-4">
            <Button
              variant="secondary"
              size="sm"
              icon={Receipt}
              onClick={() => setShowReceiptScanner(true)}
            >
              Scan Receipt
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="expense-form">
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
                className="text-3xl font-bold font-mono text-center bg-transparent border-none text-[var(--color-danger)] focus:outline-none w-32"
              />
            </div>
          </div>

          {/* Date */}
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

          {/* Category - native select for optgroup support */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Category</label>
            {!showAddCategory ? (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="
                      w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
                      rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
                      px-3.5 py-2.5 text-sm appearance-none cursor-pointer
                      transition-all duration-[var(--transition-fast)]
                      focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
                    "
                    style={{ borderLeft: `4px solid ${selectedCategory?.color || '#94918b'}` }}
                  >
                    {budgetCategories.length > 0 && (
                      <optgroup label="Budget Categories">
                        {budgetCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {otherCategories.length > 0 && (
                      <optgroup label="Other Categories">
                        {otherCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
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
                <Input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowAddCategory(false)
                      setNewCategoryName('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    className="flex-1"
                    disabled={!newCategoryName.trim()}
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
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Payment</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(method => {
                const isSelected = formData.paymentMethod === method.id
                const Icon = method.id === 'bank' ? Landmark : CreditCard
                return (
                  <Button
                    key={method.id}
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    className="flex-col gap-1 py-3"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                    type="button"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[12px]">{method.name.split(' ')[0]}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <Input
            label="Description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What was this for?"
          />
        </form>
      </Modal>

      {/* Receipt Scanner Modal */}
      {showReceiptScanner && (
        <ReceiptScanner
          onExtracted={handleReceiptData}
          onClose={() => setShowReceiptScanner(false)}
        />
      )}
    </>
  )
}
