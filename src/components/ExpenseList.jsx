import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getCategoryById, getPaymentMethodById, expenseCategories } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getTotal } from '../utils/calculations'
import ExpenseForm from './ExpenseForm'
import * as LucideIcons from 'lucide-react'

function CategoryIcon({ categoryId }) {
  const category = getCategoryById(categoryId)
  if (!category) return null
  const Icon = LucideIcons[category.icon]
  return Icon ? <Icon className="w-5 h-5" style={{ color: category.color }} /> : null
}

export default function ExpenseList() {
  const { state, deleteExpense } = useMoney()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

  const filteredExpenses = useMemo(() => {
    let expenses = [...state.expenses]
    const [year, month] = selectedMonth.split('-').map(Number)
    expenses = getMonthlyExpenses(expenses, new Date(year, month - 1, 1))
    if (searchTerm) {
      expenses = expenses.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryById(e.category)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterCategory) expenses = expenses.filter(e => e.category === filterCategory)
    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [state.expenses, searchTerm, filterCategory, selectedMonth])

  const totalExpenses = getTotal(filteredExpenses)

  const handleEdit = (expense) => { setEditingExpense(expense); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingExpense(null) }
  const handleDelete = (id) => { if (confirm('Delete this expense?')) { deleteExpense(id); toast.success('Deleted') } }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)]">Total Spent</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-danger)]">{formatCurrency(totalExpenses)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input" style={{ width: 'auto' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="">All Categories</option>
          {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0 }}>
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--color-text-muted)]">No expenses found</p>
          </div>
        ) : (
          <div>
            {filteredExpenses.map((expense, i) => {
              const category = getCategoryById(expense.category)
              const paymentMethod = getPaymentMethodById(expense.paymentMethod)
              return (
                <div key={expense.id} className={`flex items-center gap-4 p-4 hover:bg-[var(--color-bg-hover)] transition-colors group ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${category?.color}15` }}>
                    <CategoryIcon categoryId={expense.category} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{expense.description || category?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-[var(--color-text-muted)]">{format(parseISO(expense.date), 'MMM d')}</span>
                      <span className="text-[12px] px-2 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">{paymentMethod?.name.split(' ')[0]}</span>
                    </div>
                  </div>
                  <p className="font-mono font-semibold text-[var(--color-danger)]">-{formatCurrency(expense.amount)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(expense)} className="btn btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(expense.id)} className="btn btn-danger p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>{showForm && <ExpenseForm expense={editingExpense} onClose={handleCloseForm} />}</AnimatePresence>
    </motion.div>
  )
}
