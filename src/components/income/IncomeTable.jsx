import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { getIncomeSourceById } from '@/data/categories'
import { formatCurrency } from '@/utils/calculations'

const columnHelper = createColumnHelper()

export default function IncomeTable({ data, currency, customCategories = [], categoryOverrides = {}, onEdit, onDelete }) {
  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ getValue }) => {
        const d = parseISO(getValue())
        return (
          <span className="text-sm text-slate-600 whitespace-nowrap">
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )
      },
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-slate-900">{getValue() || '—'}</span>
      ),
    }),
    columnHelper.accessor('source', {
      header: 'Source',
      cell: ({ getValue }) => {
        const customIncome = customCategories.filter((c) => c.type === 'income')
        const src = getIncomeSourceById(getValue(), customIncome, categoryOverrides)
        return src ? (
          <Badge variant="success" size="sm">{src.name}</Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold font-number text-success-600 whitespace-nowrap">
          +{formatCurrency(getValue(), currency)}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row.original) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row.original.id) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }),
  ], [currency, customCategories, categoryOverrides, onEdit, onDelete])

  return (
    <Table
      data={data}
      columns={columns}
      pageSize={15}
      emptyMessage="No income records found"
    />
  )
}
