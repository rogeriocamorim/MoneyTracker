import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { getCategoryById } from '@/data/categories'
import { formatCurrency } from '@/utils/calculations'

const columnHelper = createColumnHelper()

export default function TransactionTable({ data, currency, customCategories = [], categoryOverrides = {}, onRowClick, onEdit, onDelete }) {
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
      sortingFn: 'datetime',
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ row }) => {
        const tx = row.original
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {tx.description || 'Transaction'}
            </p>
          </div>
        )
      },
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: ({ getValue }) => {
        const cat = getCategoryById(getValue(), customCategories, categoryOverrides)
        return cat ? (
          <Badge variant="neutral" size="sm">{cat.name}</Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold font-number text-danger-600 whitespace-nowrap">
          -{formatCurrency(getValue(), currency)}
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
  ], [currency, customCategories, onEdit, onDelete])

  return (
    <Table
      data={data}
      columns={columns}
      pageSize={15}
      onRowClick={onRowClick}
      emptyMessage="No transactions found"
    />
  )
}
