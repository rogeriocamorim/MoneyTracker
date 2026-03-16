import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Tag, CreditCard, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'
import * as LucideIcons from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { getPaymentMethodById } from '../data/categories'
import { formatCurrency } from '../utils/calculations'
import ExpenseForm from './ExpenseForm'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Badge from './ui/Badge'

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

  const headerContent = (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: category.color }} />
      </div>
      <div>
        <span className="text-lg font-semibold text-[var(--color-text-primary)]">{category.name}</span>
        <p className="text-sm text-[var(--color-text-muted)]">
          {categoryExpenses.length} {categoryExpenses.length === 1 ? 'expense' : 'expenses'} &middot;{' '}
          <span className="font-mono font-semibold text-[var(--color-danger)]">{formatCurrency(totalAmount)}</span>
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={headerContent}
        size="md"
      >
        {categoryExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[var(--color-text-muted)]">No expenses in this category</p>
          </div>
        ) : (
          <div className="space-y-1 -mx-2">
            {categoryExpenses.map((expense) => {
              const method = getPaymentMethodById(expense.paymentMethod)
              const PayIcon = expense.paymentMethod === 'bank' ? Landmark : CreditCard
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {category.name}
                    </p>
                    {expense.description && (
                      <p className="text-[12px] text-[var(--color-text-muted)] truncate">{expense.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] text-[var(--color-text-muted)]">
                        {format(parseISO(expense.date), 'MMM d, yyyy')}
                      </span>
                      {method && (
                        <>
                          <span className="text-[var(--color-text-muted)]">&middot;</span>
                          <Badge variant="default" size="sm">
                            <PayIcon className="w-3 h-3" />
                            {method.name.split(' ')[0]}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="font-mono font-semibold text-[var(--color-danger)]">
                    -{formatCurrency(expense.amount)}
                  </p>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5"
                      onClick={() => handleEdit(expense)}
                      title="Edit expense"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="p-1.5"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <ExpenseForm expense={editingExpense} onClose={handleCloseEdit} />
        )}
      </AnimatePresence>
    </>
  )
}
