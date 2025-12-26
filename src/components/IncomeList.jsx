import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { getIncomeSourceById, incomeSources } from '../data/categories'
import { formatCurrency, getMonthlyIncome, getTotal } from '../utils/calculations'
import IncomeForm from './IncomeForm'
import * as LucideIcons from 'lucide-react'

function SourceIcon({ sourceId, size = 'w-5 h-5' }) {
  const source = getIncomeSourceById(sourceId)
  if (!source) return null
  const Icon = LucideIcons[source.icon]
  return Icon ? <Icon className={size} style={{ color: source.color }} /> : null
}

export default function IncomeList() {
  const { state, deleteIncome } = useMoney()
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

  const filteredIncome = useMemo(() => {
    let income = [...state.income]
    
    // Filter by month
    const [year, month] = selectedMonth.split('-').map(Number)
    const monthDate = new Date(year, month - 1, 1)
    income = getMonthlyIncome(income, monthDate)
    
    // Filter by search term
    if (searchTerm) {
      income = income.filter(i => 
        i.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getIncomeSourceById(i.source)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by source
    if (filterSource) {
      income = income.filter(i => i.source === filterSource)
    }
    
    // Sort by date (newest first)
    income.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return income
  }, [state.income, searchTerm, filterSource, selectedMonth])

  const totalIncome = getTotal(filteredIncome)

  const handleEdit = (income) => {
    setEditingIncome(income)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingIncome(null)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      deleteIncome(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--color-text-muted)] text-sm">Total for selected period</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-accent)]">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-semibold flex items-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Income
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
            placeholder="Search income..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        
        {/* Source filter */}
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
        >
          <option value="">All Sources</option>
          {incomeSources.map(source => (
            <option key={source.id} value={source.id}>{source.name}</option>
          ))}
        </select>
      </div>

      {/* Income list */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {filteredIncome.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--color-text-muted)]">No income entries found</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Click "Add Income" to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredIncome.map(income => {
              const source = getIncomeSourceById(income.source)
              
              return (
                <div
                  key={income.id}
                  className="p-4 flex items-center gap-4 hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  {/* Source icon */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${source?.color}20` }}
                  >
                    <SourceIcon sourceId={income.source} />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {source?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {format(parseISO(income.date), 'MMM d, yyyy')}
                      </span>
                      {income.notes && (
                        <span className="text-xs text-[var(--color-text-muted)] truncate">
                          • {income.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <p className="font-mono font-semibold text-[var(--color-accent)]">
                    +{formatCurrency(income.amount)}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(income)}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
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
        <IncomeForm income={editingIncome} onClose={handleCloseForm} />
      )}
    </div>
  )
}

