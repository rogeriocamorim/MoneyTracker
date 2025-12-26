import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, AlertTriangle, CheckCircle, TrendingDown, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMoney } from '../context/MoneyContext'
import { expenseCategories, getCategoryById } from '../data/categories'
import { formatCurrency, getMonthlyExpenses, getBudgetProgress } from '../utils/calculations'
import BudgetForm from './BudgetForm'
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
    <motion.div variants={item} className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </p>
      {subtext && <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtext}</p>}
    </motion.div>
  )
}

export default function BudgetManager() {
  const { state, updateBudget } = useMoney()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthlyExpenses = getMonthlyExpenses(state.expenses, monthDate)
  
  // Get all budget progress including those with budgets set
  const allBudgetProgress = useMemo(() => {
    return getBudgetProgress(monthlyExpenses, state.budgets)
  }, [monthlyExpenses, state.budgets])
  
  // Split into active budgets (amount > 0) and available categories
  const activeBudgets = allBudgetProgress.filter(b => b.budget > 0)
  const availableCategories = expenseCategories.filter(
    cat => !state.budgets[cat.id] || state.budgets[cat.id] === 0
  )
  
  const totalBudget = activeBudgets.reduce((sum, b) => sum + b.budget, 0)
  const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overBudgetCategories = activeBudgets.filter(b => b.spent > b.budget).length

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingBudget(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

  const handleDelete = (category) => {
    if (confirm('Remove this budget?')) {
      updateBudget(category, 0)
      toast.success('Budget removed')
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total Budget</p>
          <p className="text-3xl font-bold font-mono text-[var(--color-accent)]">
            {formatCurrency(totalBudget)}
          </p>
        </div>
        <motion.button
          onClick={handleAdd}
          className="px-5 py-2.5 rounded-xl btn-primary flex items-center gap-2 self-start"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={availableCategories.length === 0}
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </motion.button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
        <p className="text-sm text-[var(--color-text-muted)] hidden sm:block">
          {activeBudgets.length} active {activeBudgets.length === 1 ? 'budget' : 'budgets'}
        </p>
      </motion.div>

      {/* Active Budgets */}
      <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Active Budgets</h3>
        </div>
        
        {activeBudgets.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">No budgets set</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
              Create budgets to track your spending limits
            </p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-xl btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Your First Budget
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {activeBudgets
              .sort((a, b) => b.percentage - a.percentage)
              .map(budget => {
                const category = getCategoryById(budget.category)
                const statusColor = getStatusColor(budget.percentage, budget.spent, budget.budget)

                return (
                  <div
                    key={budget.category}
                    className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors group"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${category?.color}15` }}
                      >
                        <CategoryIcon categoryId={budget.category} size="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {category?.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {formatCurrency(budget.spent)} of {formatCurrency(budget.budget)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p 
                          className="font-mono font-semibold text-sm"
                          style={{ color: statusColor }}
                        >
                          {budget.spent > budget.budget 
                            ? `${formatCurrency(Math.abs(budget.remaining))} over`
                            : `${formatCurrency(budget.remaining)} left`
                          }
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {Math.round(budget.percentage)}% used
                        </p>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.category)}
                          className="p-2 rounded-lg hover:bg-[var(--color-danger-muted)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, budget.percentage)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ backgroundColor: statusColor }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </motion.div>

      {/* Quick Add Section - Categories without budgets */}
      {availableCategories.length > 0 && (
        <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Available Categories</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Click to add a budget for these categories
            </p>
          </div>
          
          <div className="p-4 flex flex-wrap gap-2">
            {availableCategories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setEditingBudget(null)
                  setShowForm(true)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors text-sm"
              >
                <CategoryIcon categoryId={category.id} size="w-4 h-4" />
                <span className="text-[var(--color-text-secondary)]">{category.name}</span>
                <Plus className="w-3 h-3 text-[var(--color-text-muted)]" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <BudgetForm budget={editingBudget} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
