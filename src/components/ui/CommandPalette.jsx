import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ArrowRight,
  Plus,
  Download,
  FileUp,
  ScanLine,
  Sun,
  Moon,
  Receipt,
  Wallet,
  Calendar,
  TrendingDown,
  TrendingUp,
  Hash,
} from 'lucide-react'
import { mainRoutes } from '../../config/routes'
import { useMoney } from '../../context/MoneyContext'
import { useTheme } from '../../context/ThemeContext'
import { getCategoryById } from '../../data/categories'

const groupHeadingClasses =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]'

const itemClasses =
  'flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] cursor-pointer data-[selected=true]:bg-[var(--color-accent-muted)] data-[selected=true]:text-[var(--color-accent)]'

function formatCurrency(amount, symbol = '$') {
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CommandPalette({ isOpen, onClose, onAction }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useMoney()
  const { theme, toggleTheme } = useTheme()

  // Reset search when opened
  useEffect(() => {
    if (isOpen) setSearch('')
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const currencySymbol = state.settings?.currencySymbol || '$'

  const handleSelect = useCallback(
    (value) => {
      onClose()
      if (value === 'action:toggle-theme') {
        toggleTheme()
      } else if (value.startsWith('/')) {
        navigate(value)
      } else if (value.startsWith('action:')) {
        const actionId = value.replace('action:', '')
        onAction?.(actionId)
      }
    },
    [navigate, onClose, onAction, toggleTheme]
  )

  // Searchable transactions — merge expenses + income, sorted by date descending
  const allTransactions = useMemo(() => {
    const expenses = (state.expenses || []).map((e) => ({
      ...e,
      _type: 'expense',
      _searchText: `${e.description || ''} ${getCategoryById(e.category, state.customCategories)?.name || e.category || ''} ${e.amount}`.toLowerCase(),
    }))
    const income = (state.income || []).map((i) => ({
      ...i,
      _type: 'income',
      _searchText: `${i.description || ''} ${i.source || ''} ${i.amount}`.toLowerCase(),
    }))
    return [...expenses, ...income].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )
  }, [state.expenses, state.income, state.customCategories])

  // Filter transactions based on search text (only when user is typing)
  const filteredTransactions = useMemo(() => {
    if (!search || search.length < 2) return []
    const q = search.toLowerCase()
    return allTransactions
      .filter((t) => t._searchText.includes(q))
      .slice(0, 8)
  }, [search, allTransactions])

  // Quick stats for the footer
  const transactionCount = allTransactions.length

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Command palette */}
          <div className="relative flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg"
            >
              <Command
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden"
                label="Command palette"
              >
                {/* Input */}
                <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
                  <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Type a command or search transactions..."
                    className="w-full py-3.5 text-sm bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded border border-[var(--color-border)]">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <Command.List className="max-h-[360px] overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                    No results found.
                  </Command.Empty>

                  {/* Transaction search results (only show when searching) */}
                  {filteredTransactions.length > 0 && (
                    <Command.Group heading="Transactions" className={groupHeadingClasses}>
                      {filteredTransactions.map((t) => {
                        const isExpense = t._type === 'expense'
                        const categoryInfo = isExpense
                          ? getCategoryById(t.category, state.customCategories)
                          : null
                        const label = t.description || categoryInfo?.name || t.source || 'Transaction'
                        const sublabel = isExpense
                          ? categoryInfo?.name || t.category
                          : t.source || 'Income'
                        const targetPath = isExpense ? '/expenses' : '/income'

                        return (
                          <Command.Item
                            key={t.id}
                            value={`transaction ${t.description || ''} ${sublabel} ${t.amount}`}
                            onSelect={() => handleSelect(targetPath)}
                            className={itemClasses}
                          >
                            {isExpense ? (
                              <TrendingDown className="w-4 h-4 shrink-0 text-[var(--color-danger)]" />
                            ) : (
                              <TrendingUp className="w-4 h-4 shrink-0 text-[var(--color-success)]" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{label}</div>
                              <div className="text-xs text-[var(--color-text-muted)] truncate">
                                {sublabel} &middot; {formatDate(t.date)}
                              </div>
                            </div>
                            <span
                              className={`text-xs font-medium shrink-0 ${
                                isExpense ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
                              }`}
                            >
                              {isExpense ? '-' : '+'}
                              {formatCurrency(t.amount, currencySymbol)}
                            </span>
                          </Command.Item>
                        )
                      })}
                    </Command.Group>
                  )}

                  {/* Navigation */}
                  <Command.Group heading="Navigate" className={groupHeadingClasses}>
                    {mainRoutes.map((route) => {
                      const Icon = route.icon
                      const isActive = location.pathname === route.path || (route.path === '/' && location.pathname === '')
                      return (
                        <Command.Item
                          key={route.path}
                          value={`navigate ${route.label} ${route.description}`}
                          onSelect={() => handleSelect(route.path)}
                          className={itemClasses}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="flex-1">{route.label}</span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-medium">
                              current
                            </span>
                          )}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 [[data-selected=true]>&]:opacity-100" />
                        </Command.Item>
                      )
                    })}
                  </Command.Group>

                  {/* Quick Actions */}
                  <Command.Group heading="Actions" className={groupHeadingClasses}>
                    <Command.Item
                      value="Add new expense"
                      onSelect={() => handleSelect('/expenses')}
                      className={itemClasses}
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span className="flex-1">Add expense</span>
                      <Receipt className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    </Command.Item>
                    <Command.Item
                      value="Add new income"
                      onSelect={() => handleSelect('/income')}
                      className={itemClasses}
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span className="flex-1">Add income</span>
                      <Wallet className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    </Command.Item>
                    <Command.Item
                      value="Import bank statement PDF"
                      onSelect={() => handleSelect('action:import-statement')}
                      className={itemClasses}
                    >
                      <FileUp className="w-4 h-4 shrink-0" />
                      <span>Import bank statement</span>
                    </Command.Item>
                    <Command.Item
                      value="Scan receipt camera OCR"
                      onSelect={() => handleSelect('action:scan-receipt')}
                      className={itemClasses}
                    >
                      <ScanLine className="w-4 h-4 shrink-0" />
                      <span>Scan receipt</span>
                    </Command.Item>
                    <Command.Item
                      value="Export data backup JSON"
                      onSelect={() => handleSelect('action:export-data')}
                      className={itemClasses}
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Export data</span>
                    </Command.Item>
                    <Command.Item
                      value={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode theme`}
                      onSelect={() => handleSelect('action:toggle-theme')}
                      className={itemClasses}
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 shrink-0" />
                      ) : (
                        <Moon className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
                      </span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>

                {/* Footer hint */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {transactionCount} transactions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[10px]">
                      &uarr;&darr;
                    </kbd>
                    <span>navigate</span>
                    <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)] text-[10px]">
                      &crarr;
                    </kbd>
                    <span>select</span>
                  </div>
                </div>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
