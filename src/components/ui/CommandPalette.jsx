import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ArrowRight,
  Plus,
  Download,
  FileUp,
} from 'lucide-react'
import { mainRoutes, toolActions } from '../../config/routes'
import { useMoney } from '../../context/MoneyContext'

export default function CommandPalette({ isOpen, onClose, onAction }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { state } = useMoney()

  // Reset search when opened
  useEffect(() => {
    if (isOpen) setSearch('')
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  const handleSelect = useCallback(
    (value) => {
      onClose()
      if (value.startsWith('/')) {
        navigate(value)
      } else if (value.startsWith('action:')) {
        const actionId = value.replace('action:', '')
        onAction?.(actionId)
      }
    },
    [navigate, onClose, onAction]
  )

  // Recent transactions for search
  const recentTransactions = useMemo(() => {
    const expenses = (state.expenses || []).slice(-20).map((e) => ({
      ...e,
      type: 'expense',
    }))
    const income = (state.income || []).slice(-20).map((i) => ({
      ...i,
      type: 'income',
    }))
    return [...expenses, ...income]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
  }, [state.expenses, state.income])

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
          <div className="relative flex items-start justify-center pt-[15vh] px-4">
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
                    placeholder="Type a command or search..."
                    className="w-full py-3.5 text-sm bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded border border-[var(--color-border)]">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                    No results found.
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]">
                    {mainRoutes.map((route) => {
                      const Icon = route.icon
                      return (
                        <Command.Item
                          key={route.path}
                          value={`${route.label} ${route.description}`}
                          onSelect={() => handleSelect(route.path)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] cursor-pointer aria-selected:bg-[var(--color-accent-muted)] aria-selected:text-[var(--color-accent)]"
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="flex-1">{route.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-aria-selected:opacity-100" />
                        </Command.Item>
                      )
                    })}
                  </Command.Group>

                  {/* Quick Actions */}
                  <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]">
                    <Command.Item
                      value="Add expense"
                      onSelect={() => handleSelect('/expenses')}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] cursor-pointer aria-selected:bg-[var(--color-accent-muted)] aria-selected:text-[var(--color-accent)]"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Add expense</span>
                    </Command.Item>
                    <Command.Item
                      value="Add income"
                      onSelect={() => handleSelect('/income')}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] cursor-pointer aria-selected:bg-[var(--color-accent-muted)] aria-selected:text-[var(--color-accent)]"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Add income</span>
                    </Command.Item>
                    <Command.Item
                      value="Import statement"
                      onSelect={() => handleSelect('action:import-statement')}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] cursor-pointer aria-selected:bg-[var(--color-accent-muted)] aria-selected:text-[var(--color-accent)]"
                    >
                      <FileUp className="w-4 h-4 shrink-0" />
                      <span>Import bank statement</span>
                    </Command.Item>
                    <Command.Item
                      value="Export data"
                      onSelect={() => handleSelect('action:export-data')}
                      className="flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-secondary)] rounded-[var(--radius-md)] cursor-pointer aria-selected:bg-[var(--color-accent-muted)] aria-selected:text-[var(--color-accent)]"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Export data</span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
