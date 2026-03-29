import { useState, useMemo } from 'react'
import { PieChart, Plus, ChevronLeft, ChevronRight, Copy, ChevronDown } from 'lucide-react'
import { format, subMonths, addMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { useMoney } from '@/context/MoneyContext'
import { getBudgetProgress, getBudgetsForMonth, formatCurrency } from '@/utils/calculations'
import { getCategoryById, expenseCategories } from '@/data/categories'
import { Button, Modal, EmptyState, Select, Input, ProgressBar, Card } from '@/components/ui'

export default function BudgetsPage() {
  const { state, dispatch } = useMoney()
  const { expenses, budgets, settings, customCategories, categoryOverrides = {} } = state
  const currency = settings?.currencySymbol || '$'
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expandedCategory, setExpandedCategory] = useState(null)

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
