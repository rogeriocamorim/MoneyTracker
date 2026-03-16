import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, TrendingUp } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { getIncomeSourceById, incomeSources } from '../data/categories'
import { formatCurrency, getMonthlyIncome, getTotal } from '../utils/calculations'
import IncomeForm from './IncomeForm'
import { Card, Button, Input, Select, EmptyState, DataTable } from './ui'

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

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    ...incomeSources.map(s => ({ value: s.id, label: s.name })),
  ]

  const columns = useMemo(() => [
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        const income = row.original
        const source = getIncomeSourceById(income.source)
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-success-muted)] shrink-0">
              <SourceIcon sourceId={income.source} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-text-primary)] truncate">
                {income.notes || source?.name || 'Income'}
              </p>
              <span className="text-[12px] px-2 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                {source?.name}
              </span>
            </div>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-[var(--color-text-muted)]">
          {format(parseISO(row.original.date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-[var(--color-success)]">
          +{formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(row.original) }}
            title="Edit income"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id) }}
            title="Delete income"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      size: 100,
    },
  ], [])

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)]">Total Income</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-success)]">{formatCurrency(totalIncome)}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
          Add Income
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text-primary)] px-3.5 py-2.5 text-sm transition-all duration-[var(--transition-fast)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]"
          style={{ width: 'auto' }}
        />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          containerClassName="flex-1 min-w-[200px]"
        />
        <Select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          options={sourceOptions}
          placeholder=""
          containerClassName="w-auto"
        />
      </div>

      {/* Income Table */}
      <Card padding={false}>
        {filteredIncome.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No income found"
            description="Try adjusting your filters or add a new income entry."
            action={() => setShowForm(true)}
            actionLabel="Add Income"
          />
        ) : (
          <DataTable
            data={filteredIncome}
            columns={columns}
            enablePagination={true}
            enableSorting={true}
            pageSize={10}
          />
        )}
      </Card>

      <AnimatePresence>{showForm && <IncomeForm income={editingIncome} onClose={handleCloseForm} />}</AnimatePresence>
    </motion.div>
  )
}
