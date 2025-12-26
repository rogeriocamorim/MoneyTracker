import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getIncomeSourceById, incomeSources } from '../data/categories'
import { formatCurrency, getMonthlyIncome, getTotal } from '../utils/calculations'
import IncomeForm from './IncomeForm'
import * as LucideIcons from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

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
    
    const [year, month] = selectedMonth.split('-').map(Number)
    const monthDate = new Date(year, month - 1, 1)
    income = getMonthlyIncome(income, monthDate)
    
    if (searchTerm) {
      income = income.filter(i => 
        i.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getIncomeSourceById(i.source)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterSource) {
      income = income.filter(i => i.source === filterSource)
    }
    
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
    if (confirm('Delete this income entry?')) {
      deleteIncome(id)
      toast.success('Income deleted')
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total Earned</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-success)]">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <motion.button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-xl btn-primary flex items-center gap-2 self-start"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Add Income
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        >
          <option value="">All Sources</option>
          {incomeSources.map(source => (
            <option key={source.id} value={source.id}>{source.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredIncome.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)]">No income found</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Try adjusting your filters or add new income
            </p>
          </div>
        ) : (
          <motion.div 
            className="divide-y divide-[var(--color-border)]"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredIncome.map(income => {
              const source = getIncomeSourceById(income.source)
              
              return (
                <motion.div
                  key={income.id}
                  variants={item}
                  className="p-4 flex items-center gap-4 hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${source?.color}15` }}
                  >
                    <SourceIcon sourceId={income.source} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {source?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {format(parseISO(income.date), 'MMM d')}
                      </span>
                      {income.notes && (
                        <span className="text-xs text-[var(--color-text-muted)] truncate">
                          • {income.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="font-mono font-semibold text-[var(--color-success)]">
                    +{formatCurrency(income.amount)}
                  </p>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(income)}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="p-2 rounded-lg hover:bg-[var(--color-danger-muted)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <IncomeForm income={editingIncome} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
