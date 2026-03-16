import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, Tag, CreditCard, Landmark, Receipt } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getCategoryById, getPaymentMethodById, getAllCategories, paymentMethods } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getTotal } from '../utils/calculations'
import ExpenseForm from './ExpenseForm'
import { Card, Button, Input, Select, EmptyState, DataTable, Badge } from './ui'

export default function ExpenseList() {
  const { state, deleteExpense } = useMoney()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

  const allCategories = getAllCategories(state.customCategories)

  const filteredExpenses = useMemo(() => {
    let expenses = [...state.expenses]
    const [year, month] = selectedMonth.split('-').map(Number)
    expenses = getMonthlyExpenses(expenses, new Date(year, month - 1, 1))
    if (searchTerm) {
      expenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryById(e.category, state.customCategories)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterCategory) expenses = expenses.filter(e => e.category === filterCategory)
    if (filterPayment) expenses = expenses.filter(e => e.paymentMethod === filterPayment)
    return expenses.sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date)
      if (dateCompare !== 0) return dateCompare
      // Same date: sort by createdAt descending (most recently added first)
      return (b.createdAt || 0) - (a.createdAt || 0)
    })
  }, [state.expenses, state.customCategories, searchTerm, filterCategory, filterPayment, selectedMonth])

  const totalExpenses = getTotal(filteredExpenses)

  const handleEdit = (expense) => { setEditingExpense(expense); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingExpense(null) }
  const handleDelete = (id) => { if (confirm('Delete this expense?')) { deleteExpense(id); toast.success('Deleted') } }

  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...allCategories.map(cat => ({ value: cat.id, label: cat.name })),
  ], [allCategories])

  const paymentOptions = useMemo(() => [
    { value: '', label: 'All Payments' },
    ...paymentMethods.map(m => ({ value: m.id, label: m.name })),
  ], [])

  const columns = useMemo(() => [
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const expense = row.original
        const category = getCategoryById(expense.category, state.customCategories)
        const Icon = LucideIcons[category?.icon] || Tag
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center"
              style={{ backgroundColor: `${category?.color || '#94918b'}15` }}
            >
              <Icon className="w-4 h-4" style={{ color: category?.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-text-primary)] truncate">{category?.name}</p>
              {expense.description && (
                <p className="text-xs text-[var(--color-text-muted)] truncate">{expense.description}</p>
              )}
            </div>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
          {format(parseISO(row.original.date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment',
      cell: ({ row }) => {
        const method = getPaymentMethodById(row.original.paymentMethod)
        if (!method) return null
        const Icon = row.original.paymentMethod === 'bank' ? Landmark : CreditCard
        return (
          <Badge
            variant="default"
            size="sm"
            className="whitespace-nowrap"
            style={{
              backgroundColor: `${method.color}15`,
              color: method.color,
            }}
          >
            <Icon className="w-3 h-3" />
            {method.name.split(' ')[0]}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-[var(--color-danger)] whitespace-nowrap">
          -{formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            onClick={(e) => { e.stopPropagation(); handleEdit(row.original) }}
            title="Edit expense"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="p-1.5"
            onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id) }}
            title="Delete expense"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      size: 100,
    },
  ], [state.customCategories])

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)]">Total Spent</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-danger)]">{formatCurrency(totalExpenses)}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="
            bg-[var(--color-bg-input)] border border-[var(--color-border)]
            rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
            px-3.5 py-2.5 text-sm
            transition-all duration-[var(--transition-fast)]
            focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
          "
          style={{ width: 'auto' }}
        />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          containerClassName="flex-1 min-w-[200px]"
        />
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={categoryOptions}
          placeholder=""
          className="w-auto"
          containerClassName="w-auto"
        />
        <Select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          options={paymentOptions}
          placeholder=""
          className="w-auto"
          containerClassName="w-auto"
        />
      </div>

      {/* Expense Table */}
      <Card padding={false}>
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description="Try adjusting your filters or add a new expense."
            action={() => setShowForm(true)}
            actionLabel="Add Expense"
          />
        ) : (
          <DataTable
            data={filteredExpenses}
            columns={columns}
            enablePagination={filteredExpenses.length > 10}
            pageSize={10}
            enableSorting
            className="[&_tr]:group/row"
          />
        )}
      </Card>

      <AnimatePresence>{showForm && <ExpenseForm expense={editingExpense} onClose={handleCloseForm} />}</AnimatePresence>
    </motion.div>
  )
}
