import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, Filter, Download, ChevronDown, ChevronRight, FileUp } from 'lucide-react'
import { useMoney } from '@/context/MoneyContext'
import { formatCurrency } from '@/utils/calculations'
import { getCategoryById, expenseCategories, paymentMethods } from '@/data/categories'
import { Button, Input, Select, SearchSelect, Badge, EmptyState, Modal } from '@/components/ui'
import TransactionTable from './TransactionTable'
import TransactionDetail from './TransactionDetail'
import TransactionFilters from './TransactionFilters'
import StatementImport from './StatementImport'
import { Receipt } from 'lucide-react'

function groupByMonth(items) {
  const groups = {}
  for (const item of items) {
    const d = new Date(item.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split('-')
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
      const total = items.reduce((s, i) => s + i.amount, 0)
      return { key, label, items, total }
    })
}

export default function TransactionsPage() {
  const { state, dispatch } = useMoney()
  const { expenses, settings, customCategories, goals = [] } = state
  const currency = settings?.currencySymbol || '$'

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTx, setSelectedTx] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [filters, setFilters] = useState({ category: '', paymentMethod: '', dateFrom: '', dateTo: '' })
  const [collapsedMonths, setCollapsedMonths] = useState({})
  const [showImport, setShowImport] = useState(false)

  const filtered = useMemo(() => {
    let result = [...expenses]

    if (search) {
      const s = search.toLowerCase()
      result = result.filter((tx) => {
        const cat = getCategoryById(tx.category, customCategories)
        return (
          tx.description?.toLowerCase().includes(s) ||
          tx.merchant?.toLowerCase().includes(s) ||
          cat?.name?.toLowerCase().includes(s) ||
          String(tx.amount).includes(s)
        )
      })
    }

    if (filters.category) result = result.filter((tx) => tx.category === filters.category)
    if (filters.paymentMethod) result = result.filter((tx) => tx.paymentMethod === filters.paymentMethod)
    if (filters.dateFrom) result = result.filter((tx) => tx.date >= filters.dateFrom)
    if (filters.dateTo) result = result.filter((tx) => tx.date <= filters.dateTo)

    return result.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, search, filters, customCategories])

  const totalFiltered = filtered.reduce((s, tx) => s + tx.amount, 0)
  const monthGroups = useMemo(() => groupByMonth(filtered), [filtered])

  const toggleMonth = (key) => {
    setCollapsedMonths((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAdd = () => {
    setEditingTx(null)
    setShowForm(true)
  }

  const handleEdit = (tx) => {
    setEditingTx(tx)
    setShowForm(true)
    setSelectedTx(null)
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id })
    setSelectedTx(null)
  }

  const handleSave = (data) => {
    if (editingTx) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...editingTx, ...data, updatedAt: Date.now() } })
    } else {
      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          ...data,
          id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
        },
      })
    }
    // Auto-contribute to goal if category is a goal
    if (data.goalId) {
      dispatch({
        type: 'CONTRIBUTE_TO_GOAL',
        payload: { goalId: data.goalId, amount: Number(data.amount), date: data.date },
      })
    }
    setShowForm(false)
    setEditingTx(null)
  }

  const clearFilters = () => setFilters({ category: '', paymentMethod: '', dateFrom: '', dateTo: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={hasFilters ? 'primary' : 'outline'}
            size="sm"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {hasFilters && `(${Object.values(filters).filter(Boolean).length})`}
          </Button>
          <Button variant="outline" size="sm" icon={FileUp} onClick={() => setShowImport(true)}>
            Import
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <TransactionFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          customCategories={customCategories}
        />
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
        <span className="font-number font-medium text-slate-700">
          Total: {formatCurrency(totalFiltered, currency)}
        </span>
      </div>

      {/* Grouped by month */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description={search || hasFilters ? 'Try adjusting your search or filters' : 'Add your first expense to get started'}
          action={!search && !hasFilters ? handleAdd : undefined}
          actionLabel="Add Expense"
        />
      ) : (
        <div className="space-y-3">
          {monthGroups.map((group) => (
            <div key={group.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => toggleMonth(group.key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {collapsedMonths[group.key]
                    ? <ChevronRight className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                  <span className="text-sm font-semibold text-slate-900">{group.label}</span>
                  <span className="text-xs text-slate-400">({group.items.length})</span>
                </div>
                <span className="text-sm font-number font-semibold text-danger-600">
                  -{formatCurrency(group.total, currency)}
                </span>
              </button>
              {!collapsedMonths[group.key] && (
                <div className="border-t border-slate-100">
                  <TransactionTable
                    data={group.items}
                    currency={currency}
                    customCategories={customCategories}
                    onRowClick={setSelectedTx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail sidebar */}
      {selectedTx && (
        <TransactionDetail
          transaction={selectedTx}
          currency={currency}
          customCategories={customCategories}
          onClose={() => setSelectedTx(null)}
          onEdit={() => handleEdit(selectedTx)}
          onDelete={() => handleDelete(selectedTx.id)}
        />
      )}

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTx(null) }}
        title={editingTx ? 'Edit Expense' : 'Add Expense'}
        size="md"
      >
        <ExpenseForm
          initial={editingTx}
          customCategories={customCategories}
          goals={goals}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingTx(null) }}
        />
      </Modal>

      {/* Import statement modal */}
      <StatementImport open={showImport} onClose={() => setShowImport(false)} />
    </div>
  )
}

function ExpenseForm({ initial, customCategories = [], goals = [], onSave, onCancel }) {
  const allCategories = [...expenseCategories, ...customCategories.filter((c) => c.type === 'expense')]

  // Build grouped options: Categories + Goals (only incomplete goals)
  const GOAL_PREFIX = 'goal:'
  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount)
  const categoryOptions = [
    {
      label: 'Categories',
      options: allCategories.map((c) => ({ value: c.id, label: c.name })),
    },
    ...(activeGoals.length > 0
      ? [{
          label: 'Goals',
          options: activeGoals.map((g) => ({ value: `${GOAL_PREFIX}${g.id}`, label: `🎯 ${g.name}` })),
        }]
      : []),
  ]

  const [form, setForm] = useState({
    date: initial?.date || new Date().toISOString().slice(0, 10),
    amount: initial?.amount || '',
    category: initial?.goalId ? `${GOAL_PREFIX}${initial.goalId}` : initial?.category || '',
    description: initial?.description || '',
    paymentMethod: initial?.paymentMethod || '',
    notes: initial?.notes || '',
  })

  const isGoal = form.category.startsWith(GOAL_PREFIX)

  const handleSubmit = (e) => {
    e.preventDefault()
    const goalId = isGoal ? form.category.slice(GOAL_PREFIX.length) : null
    const goal = goalId ? goals.find((g) => g.id === goalId) : null
    onSave({
      ...form,
      amount: Number(form.amount),
      category: isGoal ? 'savings' : form.category,
      description: isGoal ? (form.description || `Contribution to ${goal?.name || 'goal'}`) : form.description,
      goalId,
    })
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.date} onChange={update('date')} required />
        <Input label="Amount" type="number" step="0.01" min="0" value={form.amount} onChange={update('amount')} required placeholder="0.00" />
      </div>
      <SearchSelect
        label="Category"
        value={form.category}
        onChange={update('category')}
        required
        options={categoryOptions}
        placeholder="Select category or goal..."
        searchPlaceholder="Search categories & goals..."
      />
      {isGoal && (
        <p className="text-xs text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
          This expense will automatically add a contribution to the selected goal.
        </p>
      )}
      <Input label="Description" value={form.description} onChange={update('description')} placeholder={isGoal ? 'Contribution note (optional)' : 'What was this for?'} />
      <Select
        label="Payment Method"
        value={form.paymentMethod}
        onChange={update('paymentMethod')}
        options={paymentMethods.map((p) => ({ value: p.id, label: p.name }))}
        placeholder="Select payment method..."
      />
      <Input label="Notes" value={form.notes} onChange={update('notes')} placeholder="Additional notes..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{initial ? 'Save Changes' : 'Add Expense'}</Button>
      </div>
    </form>
  )
}
