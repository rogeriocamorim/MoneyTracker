import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pencil, Trash2, Tag, CreditCard, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'
import * as LucideIcons from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { getPaymentMethodById } from '../data/categories'
import { formatCurrency } from '../utils/calculations'
import ExpenseForm from './ExpenseForm'

function PaymentBadge({ methodId }) {
  const method = getPaymentMethodById(methodId)
  if (!method) return null
  
  const Icon = methodId === 'bank' ? Landmark : CreditCard
  const bgColor = methodId === 'bank' ? '#3b82f620' : methodId === 'visa' ? '#1a1f7120' : '#eb001b20'
  const textColor = methodId === 'bank' ? '#3b82f6' : methodId === 'visa' ? '#1a1f71' : '#eb001b'
  
  return (
    <span 
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <Icon className="w-3 h-3" />
      {method.name.split(' ')[0]}
    </span>
  )
}

export default function CategoryExpensesModal({ category, expenses, onClose }) {
  const { deleteExpense } = useMoney()
  const [editingExpense, setEditingExpense] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const Icon = LucideIcons[category.icon] || Tag
  
  // Filter expenses for this category and sort by date (newest first)
  const categoryExpenses = expenses
    .filter(e => e.category === category.id)
    .sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date)
      if (dateCompare !== 0) return dateCompare
      return (b.createdAt || 0) - (a.createdAt || 0)
    })

  const totalAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setShowEditForm(true)
  }

  const handleCloseEdit = () => {
    setShowEditForm(false)
    setEditingExpense(null)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this expense?')) {
      deleteExpense(id)
      toast.success('Expense deleted')
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="card w-full max-w-lg max-h-[85vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: category.color }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{category.name}</h2>
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  {categoryExpenses.length} {categoryExpenses.length === 1 ? 'expense' : 'expenses'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-mono font-semibold text-[var(--color-danger)]">
                {formatCurrency(totalAmount)}
              </p>
              <button onClick={onClose} className="btn btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expense List */}
          <div className="flex-1 overflow-y-auto mt-4 -mx-4 px-4">
            {categoryExpenses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[var(--color-text-muted)]">No expenses in this category</p>
              </div>
            ) : (
              <div className="space-y-1">
                {categoryExpenses.map((expense) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text-primary)] truncate">
                        {expense.description || category.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[12px] text-[var(--color-text-muted)]">
                          {format(parseISO(expense.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-[var(--color-text-muted)]">•</span>
                        <PaymentBadge methodId={expense.paymentMethod} />
                      </div>
                    </div>
                    <p className="font-mono font-semibold text-[var(--color-danger)]">
                      -{formatCurrency(expense.amount)}
                    </p>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(expense)} 
                        className="btn btn-ghost p-2" 
                        title="Edit expense"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)} 
                        className="btn btn-danger p-2" 
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <ExpenseForm expense={editingExpense} onClose={handleCloseEdit} />
        )}
      </AnimatePresence>
    </>
  )
}
