import { useState, useMemo } from 'react'
import { Plus, Search, Wallet, ChevronDown, ChevronRight } from 'lucide-react'
import { useMoney } from '@/context/MoneyContext'
import { formatCurrency } from '@/utils/calculations'
import { incomeSources, getIncomeSourceById } from '@/data/categories'
import { Button, Input, Select, Badge, EmptyState, Modal } from '@/components/ui'
import IncomeTable from './IncomeTable'

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

export default function IncomePage() {
  const { state, dispatch } = useMoney()
  const { income, settings } = state
  const currency = settings?.currencySymbol || '$'

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [collapsedMonths, setCollapsedMonths] = useState({})

  const filtered = useMemo(() => {
    let result = [...income]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter((item) => {
        const src = getIncomeSourceById(item.source)
        return (
          item.description?.toLowerCase().includes(s) ||
          src?.name?.toLowerCase().includes(s) ||
          String(item.amount).includes(s)
        )
      })
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [income, search])

  const totalFiltered = filtered.reduce((s, item) => s + item.amount, 0)
  const monthGroups = useMemo(() => groupByMonth(filtered), [filtered])

  const toggleMonth = (key) => {
    setCollapsedMonths((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = (data) => {
    if (editingItem) {
      dispatch({ type: 'UPDATE_INCOME', payload: { ...editingItem, ...data, updatedAt: Date.now() } })
    } else {
      dispatch({
        type: 'ADD_INCOME',
        payload: {
          ...data,
          id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
        },
      })
    }
    setShowForm(false)
    setEditingItem(null)
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_INCOME', payload: id })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search income..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          />
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditingItem(null); setShowForm(true) }}>
          Add Income
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</span>
        <span className="font-number font-medium text-success-600">
          Total: {formatCurrency(totalFiltered, currency)}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No income records"
          description={search ? 'Try adjusting your search' : 'Add your first income entry'}
          action={!search ? () => { setEditingItem(null); setShowForm(true) } : undefined}
          actionLabel="Add Income"
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
                <span className="text-sm font-number font-semibold text-success-600">
                  +{formatCurrency(group.total, currency)}
                </span>
              </button>
              {!collapsedMonths[group.key] && (
                <div className="border-t border-slate-100">
                  <IncomeTable data={group.items} currency={currency} onEdit={handleEdit} onDelete={handleDelete} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingItem(null) }}
        title={editingItem ? 'Edit Income' : 'Add Income'}
        size="md"
      >
        <IncomeForm
          initial={editingItem}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingItem(null) }}
        />
      </Modal>
    </div>
  )
}

function IncomeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: initial?.date || new Date().toISOString().slice(0, 10),
    amount: initial?.amount || '',
    source: initial?.source || '',
    description: initial?.description || '',
    notes: initial?.notes || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      amount: Number(form.amount),
    })
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.date} onChange={update('date')} required />
        <Input label="Amount" type="number" step="0.01" min="0" value={form.amount} onChange={update('amount')} required placeholder="0.00" />
      </div>
      <Select
        label="Source"
        value={form.source}
        onChange={update('source')}
        required
        options={incomeSources.map((s) => ({ value: s.id, label: s.name }))}
        placeholder="Select source..."
      />
      <Input label="Description" value={form.description} onChange={update('description')} placeholder="What is this income from?" />
      <Input label="Notes" value={form.notes} onChange={update('notes')} placeholder="Additional notes..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="success" type="submit">{initial ? 'Save Changes' : 'Add Income'}</Button>
      </div>
    </form>
  )
}
