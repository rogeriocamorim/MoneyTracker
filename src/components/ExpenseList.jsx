import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getCategoryById, getPaymentMethodById, expenseCategories } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getTotal } from '../utils/calculations'
import ExpenseForm from './ExpenseForm'
import * as LucideIcons from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

function CategoryIcon({ categoryId, size = 'w-5 h-5' }) {
  const category = getCategoryById(categoryId)
  if (!category) return null
  const Icon = LucideIcons[category.icon]
  return Icon ? <Icon className={size} style={{ color: category.color }} /> : null
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
    const monthDate = new Date(year, month - 1, 1)
    expenses = getMonthlyExpenses(expenses, monthDate)
    
    if (searchTerm) {
      expenses = expenses.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryById(e.category)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterCategory) {
      expenses = expenses.filter(e => e.category === filterCategory)
    }
    
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return expenses
  }, [state.expenses, searchTerm, filterCategory, selectedMonth])

  const totalExpenses = getTotal(filteredExpenses)

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this expense?')) {
      deleteExpense(id)
      toast.success('Expense deleted')
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total Spent</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-danger)]">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <motion.button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-xl btn-primary flex items-center gap-2 self-start"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] appearance-none"
          >
            <option value="">All Categories</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)]">No expenses found</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Try adjusting your filters or add a new expense
            </p>
          </div>
        ) : (
          <motion.div 
            className="divide-y divide-[var(--color-border)]"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredExpenses.map(expense => {
              const category = getCategoryById(expense.category)
              const paymentMethod = getPaymentMethodById(expense.paymentMethod)
              
              return (
                <motion.div
                  key={expense.id}
                  variants={item}
                  className="p-4 flex items-center gap-4 hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${category?.color}15` }}
                  >
                    <CategoryIcon categoryId={expense.category} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {expense.description || category?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {format(parseISO(expense.date), 'MMM d')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                        {paymentMethod?.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  
                  <p className="font-mono font-semibold text-[var(--color-danger)]">
                    -{formatCurrency(expense.amount)}
                  </p>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 rounded-lg hover:bg-[var(--color-danger-muted)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ExpenseForm expense={editingExpense} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
