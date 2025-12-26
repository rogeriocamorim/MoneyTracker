import { useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Target, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getBudgetProgress } from '../utils/calculations'
import * as LucideIcons from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

function CategoryIcon({ categoryId, size = 'w-5 h-5' }) {
  const category = getCategoryById(categoryId)
  if (!category) return null
  const Icon = LucideIcons[category.icon]
  return Icon ? <Icon className={size} style={{ color: category.color }} /> : null
}

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <motion.div variants={item} className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </p>
      {subtext && <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtext}</p>}
    </motion.div>
  )
}

export default function BudgetManager() {
  const { state, updateBudget } = useMoney()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [editingCategory, setEditingCategory] = useState(null)
  const [editValue, setEditValue] = useState('')

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthlyExpenses = getMonthlyExpenses(state.expenses, monthDate)
  
  const budgetProgress = getBudgetProgress(monthlyExpenses, state.budgets)
  
  const totalBudget = Object.values(state.budgets).reduce((sum, b) => sum + b, 0)
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overBudgetCategories = budgetProgress.filter(b => b.spent > b.budget).length

  const handleEditStart = (category) => {
    setEditingCategory(category)
    setEditValue(state.budgets[category]?.toString() || '0')
  }

  const handleEditSave = () => {
    if (editingCategory) {
      updateBudget(editingCategory, parseFloat(editValue) || 0)
      setEditingCategory(null)
      setEditValue('')
    }
  }

  const handleEditCancel = () => {
    setEditingCategory(null)
    setEditValue('')
  }

  const getStatusColor = (percentage, spent, budget) => {
    if (spent > budget) return '#f87171'
    if (percentage >= 80) return '#fbbf24'
    return '#4ade80'
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          color="#22d3ee"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          color="#f87171"
        />
        <StatCard
          icon={CheckCircle}
          label="Remaining"
          value={formatCurrency(Math.abs(totalRemaining))}
          color={totalRemaining >= 0 ? '#4ade80' : '#f87171'}
          subtext={totalRemaining < 0 ? 'Over budget' : 'Available'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Over Budget"
          value={overBudgetCategories}
          color="#fbbf24"
          subtext={overBudgetCategories === 1 ? 'category' : 'categories'}
        />
      </div>

      {/* Month selector */}
      <motion.div variants={item} className="flex items-center gap-4">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Click any budget amount to edit
        </p>
      </motion.div>

      {/* Budget list */}
      <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-[var(--color-border)]">
          {expenseCategories.map(category => {
            const progress = budgetProgress.find(b => b.category === category.id) || {
              budget: state.budgets[category.id] || 0,
              spent: 0,
              remaining: state.budgets[category.id] || 0,
              percentage: 0,
            }
            const statusColor = getStatusColor(progress.percentage, progress.spent, progress.budget)
            const isEditing = editingCategory === category.id

            return (
              <div
                key={category.id}
                className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <CategoryIcon categoryId={category.id} size="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {category.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatCurrency(progress.spent)} spent
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-text-muted)]">$</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono text-sm focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                        <button
                          onClick={handleEditSave}
                          className="px-2 py-1 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-xs font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(category.id)}
                        className="font-mono font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {formatCurrency(progress.budget)}
                      </button>
                    )}
                    <p 
                      className="text-xs font-medium mt-1"
                      style={{ color: statusColor }}
                    >
                      {progress.spent > progress.budget 
                        ? `${formatCurrency(Math.abs(progress.remaining))} over`
                        : `${formatCurrency(progress.remaining)} left`
                      }
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress.percentage)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ backgroundColor: statusColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
