import { useState, useMemo } from 'react'
import { PieChart, Plus } from 'lucide-react'
import { useMoney } from '@/context/MoneyContext'
import { getBudgetProgress, formatCurrency } from '@/utils/calculations'
import { getCategoryById, expenseCategories } from '@/data/categories'
import { Button, Modal, EmptyState, Select, Input, ProgressBar, Card } from '@/components/ui'

export default function BudgetsPage() {
  const { state, dispatch } = useMoney()
  const { expenses, budgets, settings, customCategories } = state
  const currency = settings?.currencySymbol || '$'
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)

  const budgetProgress = useMemo(
    () => getBudgetProgress(expenses, budgets).sort((a, b) => b.percentage - a.percentage),
    [expenses, budgets]
  )

  const totalBudget = budgetProgress.reduce((s, b) => s + b.budget, 0)
  const totalSpent = budgetProgress.reduce((s, b) => s + b.spent, 0)

  const handleSave = (categoryId, amount) => {
    dispatch({
      type: 'SET_BUDGET',
      payload: { categoryId, budget: { amount: Number(amount), period: 'monthly', rollover: false } },
    })
    setShowForm(false)
    setEditingBudget(null)
  }

  const handleDelete = (categoryId) => {
    dispatch({ type: 'REMOVE_BUDGET', payload: categoryId })
  }

  const handleEdit = (b) => {
    setEditingBudget(b)
    setShowForm(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {budgetProgress.length} budget{budgetProgress.length !== 1 ? 's' : ''} &middot;{' '}
            <span className="font-number font-medium text-slate-700">
              {formatCurrency(totalSpent, currency)}
            </span>
            {' of '}
            <span className="font-number font-medium text-slate-700">
              {formatCurrency(totalBudget, currency)}
            </span>
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingBudget(null); setShowForm(true) }}>
          Add Budget
        </Button>
      </div>

      {/* Overall progress */}
      {budgetProgress.length > 0 && (
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
              onEdit={() => handleEdit(b)}
              onDelete={() => handleDelete(b.category)}
            />
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingBudget(null) }}
        title={editingBudget ? 'Edit Budget' : 'Add Budget'}
        size="sm"
      >
        <BudgetForm
          initial={editingBudget}
          existingBudgets={budgets}
          customCategories={customCategories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingBudget(null) }}
        />
      </Modal>
    </div>
  )
}

function BudgetCard({ budget, currency, customCategories, onEdit, onDelete }) {
  const cat = getCategoryById(budget.category, customCategories)
  const remaining = budget.budget - budget.spent
  const isOver = remaining < 0

  return (
    <Card hover className="flex flex-col">
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
        <span className={`font-number font-medium ${isOver ? 'text-danger-600' : 'text-success-600'}`}>
          {isOver ? `-${formatCurrency(Math.abs(remaining), currency)} over` : `${formatCurrency(remaining, currency)} left`}
        </span>
      </div>
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
    if (!category || !amount) return
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
