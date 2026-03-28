import { Select, Button, Input } from '@/components/ui'
import { expenseCategories, paymentMethods } from '@/data/categories'
import { X } from 'lucide-react'

export default function TransactionFilters({ filters, onChange, onClear, customCategories = [], accounts = [] }) {
  const allCategories = [...expenseCategories, ...customCategories.filter((c) => c.type === 'expense')]

  const update = (field) => (e) => onChange({ ...filters, [field]: e.target.value })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 animate-slide-down">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Filters</span>
        <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-1">
          <X className="w-3 h-3" /> Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select
          value={filters.category}
          onChange={update('category')}
          options={allCategories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All categories"
          size="sm"
        />
        <Select
          value={filters.paymentMethod}
          onChange={update('paymentMethod')}
          options={paymentMethods.map((p) => ({ value: p.id, label: p.name }))}
          placeholder="All payments"
          size="sm"
        />
        <Select
          value={filters.account}
          onChange={update('account')}
          options={accounts.map((a) => ({ value: a, label: a }))}
          placeholder="All accounts"
          size="sm"
        />
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={update('dateFrom')}
          size="sm"
          placeholder="From date"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={update('dateTo')}
          size="sm"
          placeholder="To date"
        />
      </div>
    </div>
  )
}
