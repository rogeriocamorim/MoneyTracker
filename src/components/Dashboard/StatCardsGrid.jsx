import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react'
import { formatCurrency } from '../../utils/calculations'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function StatCard({ icon: Icon, label, value, gradientVar, shadowVar }) {
  return (
    <motion.div variants={item}>
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)]"
        style={{
          background: `linear-gradient(135deg, var(${gradientVar}-from) 0%, var(${gradientVar}-to) 100%)`,
          boxShadow: `0 8px 24px -4px var(${shadowVar})`,
          padding: '20px 24px 24px',
          minHeight: '130px',
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-6 -top-6 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
        <div
          className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />

        <div className="relative flex flex-col h-full gap-3">
          {/* Icon */}
          <div
            className="p-2 rounded-[var(--radius-md)] self-start"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <Icon className="w-4 h-4 text-white" strokeWidth={2} />
          </div>

          {/* Label + value */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {label}
            </p>
            <p className="text-[1.6rem] font-bold font-mono text-white leading-none">
              {value}
            </p>
          </div>
        </div>
      </div>
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
        gradientVar="--stat-income"
        shadowVar="--stat-income-shadow"
      />
      <StatCard
        icon={TrendingDown}
        label="Expenses"
        value={formatCurrency(totalExpenses)}
        gradientVar="--stat-expenses"
        shadowVar="--stat-expenses-shadow"
      />
      <StatCard
        icon={Wallet}
        label="Net Savings"
        value={formatCurrency(Math.abs(savings))}
        gradientVar="--stat-savings"
        shadowVar="--stat-savings-shadow"
      />
      <StatCard
        icon={Target}
        label={periodLabel}
        value={`${budgetPercentage}%`}
        gradientVar="--stat-budget"
        shadowVar="--stat-budget-shadow"
      />
    </div>
  )
}
