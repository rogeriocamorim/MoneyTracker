import { useState, useMemo } from 'react'
import { PieChart, Plus, ChevronLeft, ChevronRight, Copy, ChevronDown, CalendarClock, Trash2, Pencil, Check, AlertTriangle, Clock } from 'lucide-react'
import { format, subMonths, addMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { useMoney } from '@/context/MoneyContext'
import { getBudgetProgress, getBudgetsForMonth, formatCurrency, getAllAnnualBillStatuses } from '@/utils/calculations'
import { getCategoryById, expenseCategories } from '@/data/categories'
import { Button, Modal, EmptyState, Select, Input, ProgressBar, Card } from '@/components/ui'

export default function BudgetsPage() {
  const { state, dispatch } = useMoney()
  const { expenses, budgets, annualBills = [], settings, customCategories, categoryOverrides = {} } = state
  const currency = settings?.currencySymbol || '$'
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expandedCategory, setExpandedCategory] = useState(null)

  // Annual bills state
  const [showBillForm, setShowBillForm] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [deletingBill, setDeletingBill] = useState(null)

  const monthKey = format(selectedDate, 'yyyy-MM')
  const monthLabel = format(selectedDate, 'MMMM yyyy')
  const isCurrentMonth = monthKey === format(new Date(), 'yyyy-MM')

  const monthBudgets = useMemo(() => getBudgetsForMonth(budgets, monthKey), [budgets, monthKey])
  const hasExplicitBudgets = !!budgets[monthKey]

  const budgetProgress = useMemo(
    () => getBudgetProgress(expenses, budgets, monthKey).sort((a, b) => b.percentage - a.percentage),
    [expenses, budgets, monthKey]
  )

  // Filter expenses for the selected month
  const monthExpenses = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number)
    const monthDate = new Date(year, month - 1, 1)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    return expenses.filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
  }, [expenses, monthKey])

  // Annual bills with auto-match status
  const currentYear = new Date().getFullYear()
  const billStatuses = useMemo(
    () => getAllAnnualBillStatuses(annualBills, expenses, currentYear),
    [annualBills, expenses, currentYear]
  )
  const totalAnnualBills = annualBills.reduce((s, b) => s + b.amount, 0)
  const paidBillsTotal = billStatuses.filter((b) => b.status === 'paid').reduce((s, b) => s + b.bill.amount, 0)

  const totalBudget = budgetProgress.reduce((s, b) => s + b.budget, 0)
  const totalSpent = budgetProgress.reduce((s, b) => s + b.spent, 0)

  const handleSave = (categoryId, amount) => {
    dispatch({
      type: 'SET_BUDGET',
      payload: { monthKey, category: categoryId, amount: Number(amount), period: 'monthly', rollover: false },
    })
    setShowForm(false)
    setEditingBudget(null)
  }

  const handleDelete = (categoryId) => {
    dispatch({ type: 'REMOVE_BUDGET', payload: { monthKey, category: categoryId } })
  }

  const handleEdit = (b) => {
    setEditingBudget(b)
    setShowForm(true)
  }

  const handleCopyFromPrevious = () => {
    const prevKey = format(subMonths(selectedDate, 1), 'yyyy-MM')
    const prevBudgets = getBudgetsForMonth(budgets, prevKey)
    if (!prevBudgets || Object.keys(prevBudgets).length === 0) return
    for (const [cat, config] of Object.entries(prevBudgets)) {
      dispatch({
        type: 'SET_BUDGET',
        payload: { monthKey, category: cat, amount: config.amount, period: config.period || 'monthly', rollover: config.rollover ?? false },
      })
    }
  }

  const toggleExpand = (categoryId) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId))
  }

  // Annual bill handlers
  const handleSaveBill = (bill) => {
    if (editingBill) {
      dispatch({ type: 'UPDATE_ANNUAL_BILL', payload: { ...bill, id: editingBill.id } })
    } else {
      dispatch({ type: 'ADD_ANNUAL_BILL', payload: bill })
    }
    setShowBillForm(false)
    setEditingBill(null)
  }

  const handleDeleteBill = () => {
    if (deletingBill) {
      dispatch({ type: 'DELETE_ANNUAL_BILL', payload: deletingBill.id })
      setDeletingBill(null)
    }
  }

  const handleTogglePaid = (bill) => {
    dispatch({
      type: 'UPDATE_ANNUAL_BILL',
      payload: { id: bill.id, paidManually: !bill.paidManually },
    })
  }

  // For the form: categories that already have a budget this month
  const existingForMonth = monthBudgets

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month navigation + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate((d) => subMonths(d, 1))}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[150px]">
            <h2 className="text-sm font-semibold text-slate-900">{monthLabel}</h2>
            {!hasExplicitBudgets && budgetProgress.length > 0 && (
              <p className="text-xs text-slate-400">inherited from previous month</p>
            )}
          </div>
          <button
            onClick={() => setSelectedDate((d) => addMonths(d, 1))}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-xs text-primary-500 hover:text-primary-700 font-medium cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hasExplicitBudgets && budgetProgress.length > 0 && (
            <Button variant="ghost" size="sm" icon={Copy} onClick={handleCopyFromPrevious}>
              Copy to this month
            </Button>
          )}
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingBudget(null); setShowForm(true) }}>
            Add Budget
          </Button>
        </div>
      </div>

      {/* Summary */}
      {budgetProgress.length > 0 && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            {budgetProgress.length} budget{budgetProgress.length !== 1 ? 's' : ''} &middot;{' '}
            <span className="font-number font-medium text-slate-700">
              {formatCurrency(totalSpent, currency)}
            </span>
            {' of '}
            <span className="font-number font-medium text-slate-700">
              {formatCurrency(totalBudget, currency)}
            </span>
          </p>
          <Card>
            <ProgressBar
              value={totalSpent}
              max={totalBudget}
              color="auto"
              size="lg"
              label="Overall Budget"
              valueLabel={`${formatCurrency(totalSpent, currency)} / ${formatCurrency(totalBudget, currency)}`}
            />
          </Card>
        </div>
      )}

      {/* Budget cards */}
      {budgetProgress.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets set"
          description="Set budgets for your spending categories to track your limits"
          action={() => { setEditingBudget(null); setShowForm(true) }}
          actionLabel="Add Budget"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetProgress.map((b) => (
            <BudgetCard
              key={b.category}
              budget={b}
              currency={currency}
              customCategories={customCategories}
              categoryOverrides={categoryOverrides}
              expenses={monthExpenses.filter((e) => e.category === b.category)}
              expanded={expandedCategory === b.category}
              onToggle={() => toggleExpand(b.category)}
              onEdit={() => handleEdit(b)}
              onDelete={() => handleDelete(b.category)}
            />
          ))}
        </div>
      )}

      {/* ─── Annual Bills Section ─────────────────── */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-slate-500" />
              Annual Bills ({currentYear})
            </h2>
            {annualBills.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                {billStatuses.filter((b) => b.status === 'paid').length} of {annualBills.length} paid &middot;{' '}
                <span className="font-number font-medium text-slate-700">
                  {formatCurrency(paidBillsTotal, currency)}
                </span>
                {' of '}
                <span className="font-number font-medium text-slate-700">
                  {formatCurrency(totalAnnualBills, currency)}
                </span>
              </p>
            )}
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingBill(null); setShowBillForm(true) }}>
            Add Bill
          </Button>
        </div>

        {annualBills.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No annual bills"
            description="Track yearly recurring expenses like property tax, insurance, and subscriptions"
            action={() => { setEditingBill(null); setShowBillForm(true) }}
            actionLabel="Add Annual Bill"
          />
        ) : (
          <div className="space-y-2">
            {billStatuses.map(({ bill, status, daysUntilDue, matchedExpense }) => (
              <AnnualBillRow
                key={bill.id}
                bill={bill}
                status={status}
                daysUntilDue={daysUntilDue}
                matchedExpense={matchedExpense}
                currency={currency}
                customCategories={customCategories}
                categoryOverrides={categoryOverrides}
                onEdit={() => { setEditingBill(bill); setShowBillForm(true) }}
                onDelete={() => setDeletingBill(bill)}
                onTogglePaid={() => handleTogglePaid(bill)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Budget form modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingBudget(null) }}
        title={editingBudget ? 'Edit Budget' : `Add Budget - ${monthLabel}`}
        size="sm"
      >
        <BudgetForm
          initial={editingBudget}
          existingBudgets={existingForMonth}
          customCategories={customCategories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingBudget(null) }}
        />
      </Modal>

      {/* Annual bill form modal */}
      <Modal
        open={showBillForm}
        onClose={() => { setShowBillForm(false); setEditingBill(null) }}
        title={editingBill ? 'Edit Annual Bill' : 'Add Annual Bill'}
        size="sm"
      >
        <AnnualBillForm
          initial={editingBill}
          customCategories={customCategories}
          categoryOverrides={categoryOverrides}
          onSave={handleSaveBill}
          onCancel={() => { setShowBillForm(false); setEditingBill(null) }}
        />
      </Modal>

      {/* Delete bill confirmation modal */}
      <Modal
        open={!!deletingBill}
        onClose={() => setDeletingBill(null)}
        title="Delete Annual Bill"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold">{deletingBill?.name}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingBill(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteBill}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function BudgetCard({ budget, currency, customCategories, categoryOverrides = {}, expenses = [], expanded, onToggle, onEdit, onDelete }) {
  const cat = getCategoryById(budget.category, customCategories, categoryOverrides)
  const remaining = budget.budget - budget.spent
  const isOver = remaining < 0
  const sorted = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses]
  )

  return (
    <Card hover className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />
          <span className="text-sm font-semibold text-slate-900">{cat?.name || budget.category}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="text-xs text-slate-400 hover:text-primary-500 cursor-pointer">Edit</button>
          <span className="text-slate-200">|</span>
          <button onClick={onDelete} className="text-xs text-slate-400 hover:text-danger-500 cursor-pointer">Remove</button>
        </div>
      </div>

      {/* Progress bar — clickable */}
      <button onClick={onToggle} className="w-full text-left cursor-pointer">
        <ProgressBar
          value={budget.spent}
          max={budget.budget}
          color="auto"
          size="md"
          showLabel={false}
        />

        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="font-number text-slate-500">
            {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.budget, currency)}
          </span>
          <div className="flex items-center gap-1">
            <span className={`font-number font-medium ${isOver ? 'text-danger-600' : 'text-success-600'}`}>
              {isOver ? `-${formatCurrency(Math.abs(remaining), currency)} over` : `${formatCurrency(remaining, currency)} left`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Expenses list */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {sorted.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No expenses this month</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {sorted.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-number text-slate-400 shrink-0">
                      {format(parseISO(e.date), 'MMM d')}
                    </span>
                    <span className="text-slate-700 truncate">
                      {e.description || e.merchant || 'No description'}
                    </span>
                  </div>
                  <span className="font-number font-medium text-slate-900 shrink-0 ml-2">
                    {formatCurrency(e.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function BudgetForm({ initial, existingBudgets = {}, customCategories = [], onSave, onCancel }) {
  const allCategories = [...expenseCategories, ...customCategories.filter((c) => c.type === 'expense')]
  const availableCategories = initial
    ? allCategories
    : allCategories.filter((c) => !existingBudgets[c.id])

  const [category, setCategory] = useState(initial?.category || '')
  const [amount, setAmount] = useState(initial?.budget || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!category || !amount || Number(amount) <= 0) return
    onSave(category, amount)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
        disabled={!!initial}
        options={availableCategories.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Select category..."
      />
      <Input
        label="Monthly Budget"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        placeholder="0.00"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{initial ? 'Update' : 'Add Budget'}</Button>
      </div>
    </form>
  )
}

// ─── Annual Bill Components ──────────────────────────────

const statusConfig = {
  paid: { label: 'Paid', color: 'bg-success-100 text-success-700', icon: Check },
  overdue: { label: 'Overdue', color: 'bg-danger-100 text-danger-700', icon: AlertTriangle },
  'due-soon': { label: 'Due Soon', color: 'bg-warning-100 text-warning-700', icon: Clock },
  upcoming: { label: 'Upcoming', color: 'bg-slate-100 text-slate-600', icon: CalendarClock },
  unknown: { label: 'No date', color: 'bg-slate-100 text-slate-500', icon: CalendarClock },
}

function AnnualBillRow({ bill, status, daysUntilDue, matchedExpense, currency, customCategories, categoryOverrides, onEdit, onDelete, onTogglePaid }) {
  const cat = getCategoryById(bill.category, customCategories, categoryOverrides)
  const cfg = statusConfig[status] || statusConfig.unknown
  const StatusIcon = cfg.icon

  const dueLabel = (() => {
    if (status === 'paid') {
      if (matchedExpense) return `Matched: ${formatCurrency(matchedExpense.amount, currency)} on ${format(parseISO(matchedExpense.date), 'MMM d')}`
      return 'Manually marked paid'
    }
    if (daysUntilDue === null) return ''
    if (daysUntilDue === 0) return 'Due today'
    if (daysUntilDue === 1) return 'Due tomorrow'
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`
    if (daysUntilDue <= 30) return `Due in ${daysUntilDue} days`
    const months = Math.round(daysUntilDue / 30)
    return `Due in ~${months} month${months !== 1 ? 's' : ''}`
  })()

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {/* Left: category dot + name + amount */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#94a3b8' }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">{bill.name}</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-number font-medium text-slate-700">{formatCurrency(bill.amount, currency)}</span>
            <span>&middot;</span>
            <span>{cat?.name || bill.category}</span>
            {bill.dueDate && (
              <>
                <span>&middot;</span>
                <span>{format(parseISO(bill.dueDate), 'MMM d')}</span>
              </>
            )}
          </div>
          {dueLabel && (
            <p className="text-[11px] text-slate-400 mt-0.5">{dueLabel}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onTogglePaid}
          className={`text-xs px-2 py-1 rounded-md cursor-pointer ${
            status === 'paid'
              ? 'bg-success-50 text-success-600 hover:bg-success-100'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
          title={status === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
        >
          {status === 'paid' ? 'Undo' : 'Mark Paid'}
        </button>
        <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary-500 cursor-pointer" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-danger-500 cursor-pointer" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  )
}

function AnnualBillForm({ initial, customCategories = [], categoryOverrides = {}, onSave, onCancel }) {
  const allCategories = [...expenseCategories, ...customCategories.filter((c) => c.type === 'expense')]

  const [name, setName] = useState(initial?.name || '')
  const [amount, setAmount] = useState(initial?.amount || '')
  const [category, setCategory] = useState(initial?.category || '')
  const [dueDate, setDueDate] = useState(initial?.dueDate || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !amount || Number(amount) <= 0 || !category) return
    onSave({ name, amount: Number(amount), category, dueDate: dueDate || null, notes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Bill Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="e.g. Property Tax"
      />
      <Input
        label="Expected Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        placeholder="0.00"
      />
      <Select
        label="Category (for auto-match)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
        options={allCategories.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Select category..."
      />
      <Input
        label="Expected Due Date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any additional notes..."
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{initial ? 'Update' : 'Add Bill'}</Button>
      </div>
    </form>
  )
}
