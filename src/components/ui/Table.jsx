import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({
  data = [],
  columns = [],
  pageSize: initialPageSize = 10,
  enableSorting = true,
  enableFiltering = false,
  enablePagination = true,
  globalFilter = '',
  onGlobalFilterChange,
  className = '',
  emptyMessage = 'No data found',
  onRowClick,
  selectedRows = [],
  enableSelection = false,
  onSelectionChange,
}) {
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: initialPageSize })
  const [rowSelection, setRowSelection] = useState({})

  const selectionColumn = useMemo(() => {
    if (!enableSelection) return []
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
    ]
  }, [enableSelection])

  const allColumns = useMemo(
    () => [...selectionColumn, ...columns],
    [selectionColumn, columns]
  )

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(newSelection)
      onSelectionChange?.(
        Object.keys(newSelection)
          .filter((k) => newSelection[k])
          .map((idx) => data[parseInt(idx)])
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering || globalFilter ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    enableRowSelection: enableSelection,
  })

  const rows = table.getRowModel().rows

  return (
    <div className={className}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--color-border)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`
                      px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider
                      ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-[var(--color-text-secondary)]' : ''}
                    `}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="ml-1">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length} className="px-4 py-12 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    border-b border-[var(--color-border)] last:border-b-0
                    transition-colors duration-100
                    ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-bg-hover)]' : ''}
                    ${row.getIsSelected() ? 'bg-[var(--color-accent-muted)]' : ''}
                  `}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
          <div className="text-xs text-[var(--color-text-muted)]">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({data.length} total)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
              const currentPage = table.getState().pagination.pageIndex
              const totalPages = table.getPageCount()
              let page
              if (totalPages <= 5) {
                page = i
              } else if (currentPage < 3) {
                page = i
              } else if (currentPage > totalPages - 4) {
                page = totalPages - 5 + i
              } else {
                page = currentPage - 2 + i
              }
              return (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page)}
                  className={`
                    w-8 h-8 rounded-[var(--radius-md)] text-xs font-medium transition-colors
                    ${
                      page === currentPage
                        ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                    }
                  `}
                >
                  {page + 1}
                </button>
              )
            })}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
