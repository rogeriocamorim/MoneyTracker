import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { getCategoryById, getPaymentMethodById, expenseCategories } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getTotal } from '../utils/calculations'
import ExpenseForm from './ExpenseForm'
import * as LucideIcons from 'lucide-react'

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
    
    // Filter by month
    const [year, month] = selectedMonth.split('-').map(Number)
    const monthDate = new Date(year, month - 1, 1)
    expenses = getMonthlyExpenses(expenses, monthDate)
    
    // Filter by search term
    if (searchTerm) {
      expenses = expenses.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryById(e.category)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by category
    if (filterCategory) {
      expenses = expenses.filter(e => e.category === filterCategory)
    }
    
    // Sort by date (newest first)
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
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--color-text-muted)] text-sm">Total for selected period</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-danger)]">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-semibold flex items-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Month selector */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        
        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] appearance-none"
          >
            <option value="">All Categories</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense list */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--color-text-muted)]">No expenses found</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Click "Add Expense" to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredExpenses.map(expense => {
              const category = getCategoryById(expense.category)
              const paymentMethod = getPaymentMethodById(expense.paymentMethod)
              
              return (
                <div
                  key={expense.id}
                  className="p-4 flex items-center gap-4 hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  {/* Category icon */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category?.color}20` }}
                  >
                    <CategoryIcon categoryId={expense.category} />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {expense.description || category?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {format(parseISO(expense.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                        {paymentMethod?.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <p className="font-mono font-semibold text-[var(--color-danger)]">
                    -{formatCurrency(expense.amount)}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ExpenseForm expense={editingExpense} onClose={handleCloseForm} />
      )}
    </div>
  )
}

