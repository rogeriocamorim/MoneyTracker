import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { allRoutes } from '@/config/routes'
import { useMoney } from '@/context/MoneyContext'
import { expenseCategories, incomeSources } from '@/data/categories'
import { formatCurrency } from '@/utils/calculations'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { state } = useMoney()

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen((o) => !o)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function go(path) {
    navigate(path)
    setOpen(false)
    setSearch('')
  }

  if (!open) return null

  // Build recent transactions for search
  const recentExpenses = (state.expenses || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)

  const recentIncome = (state.income || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const sym = state.settings?.currencySymbol || '$'

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative flex justify-center pt-[15vh]">
        <Command
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mx-4"
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, categories, transactions..."
              className="flex-1 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
              {allRoutes.map((route) => {
                const Icon = route.icon
                return (
                  <Command.Item
                    key={route.path}
                    value={route.label}
                    onSelect={() => go(route.path)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {route.label}
                  </Command.Item>
                )
              })}
            </Command.Group>

            {/* Quick actions */}
            <Command.Group heading="Quick Actions" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
              <Command.Item
                value="Add expense"
                onSelect={() => go('/transactions?action=add')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
              >
                + Add Expense
              </Command.Item>
              <Command.Item
                value="Add income"
                onSelect={() => go('/income?action=add')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
              >
                + Add Income
              </Command.Item>
            </Command.Group>

            {/* Categories */}
            <Command.Group heading="Categories" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
              {expenseCategories.slice(0, 8).map((cat) => (
                <Command.Item
                  key={cat.id}
                  value={`category ${cat.name}`}
                  onSelect={() => go(`/transactions?category=${cat.id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Recent expenses */}
            {recentExpenses.length > 0 && (
              <Command.Group heading="Recent Expenses" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
                {recentExpenses.map((exp) => (
                  <Command.Item
                    key={exp.id}
                    value={`${exp.description} ${exp.merchant || ''} ${exp.category}`}
                    onSelect={() => go('/transactions')}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                  >
                    <span className="truncate">{exp.description || exp.merchant || 'Expense'}</span>
                    <span className="text-xs font-mono text-slate-400 flex-shrink-0">
                      -{formatCurrency(exp.amount, sym)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Recent income */}
            {recentIncome.length > 0 && (
              <Command.Group heading="Recent Income" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
                {recentIncome.map((inc) => (
                  <Command.Item
                    key={inc.id}
                    value={`${inc.description} ${inc.source}`}
                    onSelect={() => go('/income')}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                  >
                    <span className="truncate">{inc.description || 'Income'}</span>
                    <span className="text-xs font-mono text-emerald-600 flex-shrink-0">
                      +{formatCurrency(inc.amount, sym)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">↵</kbd> select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">esc</kbd> close
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}
