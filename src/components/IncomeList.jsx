import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getIncomeSourceById, incomeSources } from '../data/categories'
import { formatCurrency, getMonthlyIncome, getTotal } from '../utils/calculations'
import IncomeForm from './IncomeForm'
import * as LucideIcons from 'lucide-react'

function SourceIcon({ sourceId }) {
  const source = getIncomeSourceById(sourceId)
  if (!source) return <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
  const Icon = LucideIcons[source.icon]
  return Icon ? <Icon className="w-5 h-5 text-[var(--color-success)]" /> : <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
}

export default function IncomeList() {
  const { state, deleteIncome } = useMoney()
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

  const filteredIncome = useMemo(() => {
    let incomes = [...state.income]
    const [year, month] = selectedMonth.split('-').map(Number)
    incomes = getMonthlyIncome(incomes, new Date(year, month - 1, 1))
    if (searchTerm) {
      incomes = incomes.filter(i => 
        (i.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getIncomeSourceById(i.source)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterSource) incomes = incomes.filter(i => i.source === filterSource)
    return incomes.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [state.income, searchTerm, filterSource, selectedMonth])

  const totalIncome = getTotal(filteredIncome)

  const handleEdit = (income) => { setEditingIncome(income); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingIncome(null) }
  const handleDelete = (id) => { if (confirm('Delete this income?')) { deleteIncome(id); toast.success('Deleted') } }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)]">Total Income</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-success)]">{formatCurrency(totalIncome)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Income
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input" style={{ width: 'auto' }} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="">All Sources</option>
          {incomeSources.map(src => <option key={src.id} value={src.id}>{src.name}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0 }}>
        {filteredIncome.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--color-text-muted)]">No income found</p>
          </div>
        ) : (
          <div>
            {filteredIncome.map((income, i) => {
              const source = getIncomeSourceById(income.source)
              return (
                <div key={income.id} className={`flex items-center gap-4 p-4 hover:bg-[var(--color-bg-hover)] transition-colors group ${i !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-success-muted)]">
                    <SourceIcon sourceId={income.source} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{income.notes || source?.name || 'Income'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-[var(--color-text-muted)]">{format(parseISO(income.date), 'MMM d')}</span>
                      <span className="text-[12px] px-2 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">{source?.name}</span>
                    </div>
                  </div>
                  <p className="font-mono font-semibold text-[var(--color-success)]">+{formatCurrency(income.amount)}</p>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(income)} className="btn btn-ghost p-2" title="Edit income"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(income.id)} className="btn btn-danger p-2" title="Delete income"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>{showForm && <IncomeForm income={editingIncome} onClose={handleCloseForm} />}</AnimatePresence>
    </motion.div>
  )
}
