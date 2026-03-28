import { useState, useMemo } from 'react'
import { Plus, Target, TrendingUp } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useMoney } from '@/context/MoneyContext'
import { formatCurrency } from '@/utils/calculations'
import { Button, Card, Modal, Input, Select, ProgressBar, EmptyState, Badge } from '@/components/ui'

export default function GoalsPage() {
  const { state, dispatch } = useMoney()
  const { goals = [], settings } = state
  const currency = settings?.currencySymbol || '$'
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showContribute, setShowContribute] = useState(null)

  const handleSave = (data) => {
    if (editingGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: { ...editingGoal, ...data, updatedAt: Date.now() } })
    } else {
      dispatch({
        type: 'ADD_GOAL',
        payload: {
          ...data,
          id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          currentAmount: 0,
          createdAt: Date.now(),
        },
      })
    }
    setShowForm(false)
    setEditingGoal(null)
  }

  const handleContribute = (goalId, amount) => {
    dispatch({ type: 'CONTRIBUTE_TO_GOAL', payload: { goalId, amount: Number(amount) } })
    setShowContribute(null)
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_GOAL', payload: id })
  }

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const aPercent = (a.currentAmount / a.targetAmount) * 100
      const bPercent = (b.currentAmount / b.targetAmount) * 100
      if (aPercent >= 100 && bPercent < 100) return 1
      if (bPercent >= 100 && aPercent < 100) return -1
      return bPercent - aPercent
    })
  }, [goals])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {goals.length} goal{goals.length !== 1 ? 's' : ''}
        </p>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingGoal(null); setShowForm(true) }}>
          Add Goal
        </Button>
      </div>

      {sortedGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set savings goals and track your progress toward them"
          action={() => { setEditingGoal(null); setShowForm(true) }}
          actionLabel="Create Goal"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              onEdit={() => { setEditingGoal(goal); setShowForm(true) }}
              onDelete={() => handleDelete(goal.id)}
              onContribute={() => setShowContribute(goal)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingGoal(null) }}
        title={editingGoal ? 'Edit Goal' : 'Create Goal'}
        size="md"
      >
        <GoalForm
          initial={editingGoal}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingGoal(null) }}
        />
      </Modal>

      {/* Contribute modal */}
      <Modal
        open={!!showContribute}
        onClose={() => setShowContribute(null)}
        title={`Contribute to ${showContribute?.name || 'Goal'}`}
        size="sm"
      >
        {showContribute && (
          <ContributeForm
            goal={showContribute}
            currency={currency}
            onContribute={(amount) => handleContribute(showContribute.id, amount)}
            onCancel={() => setShowContribute(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function GoalCard({ goal, currency, onEdit, onDelete, onContribute }) {
  const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const isComplete = percent >= 100
  const remaining = goal.targetAmount - goal.currentAmount

  const deadlineStr = goal.deadline
    ? parseISO(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{goal.name}</h3>
          {deadlineStr && <p className="text-xs text-slate-400 mt-0.5">Due {deadlineStr}</p>}
        </div>
        {isComplete ? (
          <Badge variant="success" size="sm">Complete</Badge>
        ) : (
          <Badge variant="primary" size="sm">{percent.toFixed(0)}%</Badge>
        )}
      </div>

      <ProgressBar
        value={goal.currentAmount}
        max={goal.targetAmount}
        color={isComplete ? 'success' : 'primary'}
        size="md"
        showLabel={false}
      />

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="font-number text-slate-500">
          {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
        </span>
        {!isComplete && (
          <span className="font-number text-slate-400">
            {formatCurrency(remaining, currency)} to go
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        {!isComplete && (
          <Button variant="primary" size="xs" icon={TrendingUp} onClick={onContribute} className="flex-1">
            Contribute
          </Button>
        )}
        <Button variant="ghost" size="xs" onClick={onEdit}>Edit</Button>
        <Button variant="ghost" size="xs" onClick={onDelete} className="text-danger-500 hover:text-danger-600">Delete</Button>
      </div>
    </Card>
  )
}

function GoalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    targetAmount: initial?.targetAmount || '',
    deadline: initial?.deadline || '',
    icon: initial?.icon || 'target',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, targetAmount: Number(form.targetAmount) })
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Goal Name" value={form.name} onChange={update('name')} required placeholder="e.g., Emergency Fund" />
      <Input label="Target Amount" type="number" step="0.01" min="0" value={form.targetAmount} onChange={update('targetAmount')} required placeholder="0.00" />
      <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={update('deadline')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{initial ? 'Save Changes' : 'Create Goal'}</Button>
      </div>
    </form>
  )
}

function ContributeForm({ goal, currency, onContribute, onCancel }) {
  const [amount, setAmount] = useState('')
  const remaining = goal.targetAmount - goal.currentAmount

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {formatCurrency(remaining, currency)} remaining to reach your goal.
      </p>
      <Input
        label="Contribution Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="success" onClick={() => onContribute(amount)} disabled={!amount || Number(amount) <= 0}>
          Add Contribution
        </Button>
      </div>
    </div>
  )
}
