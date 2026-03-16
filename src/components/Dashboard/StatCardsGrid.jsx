import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, Badge } from '../ui'
import { formatCurrency } from '../../utils/calculations'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function StatCard({ icon: Icon, label, value, trend, color, bgColor }) {
  const isUp = trend === 'up'
  
  return (
    <motion.div variants={item}>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-[var(--radius-xl)] flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          {trend && (
            <Badge variant={isUp ? 'success' : 'danger'} size="sm">
              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </Badge>
          )}
        </div>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{label}</p>
        <p className="text-2xl font-semibold font-mono" style={{ color }}>{value}</p>
      </Card>
    </motion.div>
  )
}

export default function StatCardsGrid({ totalIncome, totalExpenses, savings, budgetPercentage, periodLabel }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={TrendingUp}
        label="Income"
        value={formatCurrency(totalIncome)}
        trend="up"
        color="var(--color-success)"
        bgColor="var(--color-success-muted)"
      />
      <StatCard
        icon={TrendingDown}
        label="Expenses"
        value={formatCurrency(totalExpenses)}
        trend="down"
        color="var(--color-danger)"
        bgColor="var(--color-danger-muted)"
      />
      <StatCard
        icon={Wallet}
        label="Net Savings"
        value={formatCurrency(Math.abs(savings))}
        trend={savings >= 0 ? 'up' : 'down'}
        color={savings >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
        bgColor={savings >= 0 ? 'var(--color-success-muted)' : 'var(--color-danger-muted)'}
      />
      <StatCard
        icon={Target}
        label={periodLabel}
        value={`${budgetPercentage}%`}
        color="var(--color-accent)"
        bgColor="var(--color-accent-muted)"
      />
    </div>
  )
}
