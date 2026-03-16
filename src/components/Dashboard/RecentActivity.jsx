import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, EmptyState } from '../ui'
import { getCategoryById } from '../../data/categories'
import { formatCurrency } from '../../utils/calculations'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function RecentActivity({ filteredExpenses, filteredIncome, customCategories }) {
  const recentTransactions = useMemo(() => {
    return [...filteredExpenses, ...filteredIncome.map(i => ({ ...i, isIncome: true }))]
      .sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date)
        if (dateCompare !== 0) return dateCompare
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      .slice(0, 5)
  }, [filteredExpenses, filteredIncome])

  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={TrendingDown}
            title="No transactions"
            description="No transactions in this period"
          />
        ) : (
          <div className="space-y-1">
            {recentTransactions.map(tx => {
              const isIncome = tx.isIncome
              const category = isIncome ? null : getCategoryById(tx.category, customCategories)
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: isIncome
                        ? 'var(--color-success-muted)'
                        : `${category?.color}20`
                    }}
                  >
                    {isIncome
                      ? <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                      : <TrendingDown className="w-5 h-5" style={{ color: category?.color }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                      {isIncome ? tx.notes || 'Income' : category?.name}
                    </p>
                    {!isIncome && tx.description && (
                      <p className="text-[12px] text-[var(--color-text-muted)] truncate">{tx.description}</p>
                    )}
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      {format(new Date(tx.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <p className={`font-mono font-semibold ${isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
