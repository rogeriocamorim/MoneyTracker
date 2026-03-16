import { motion } from 'framer-motion'
import PeriodSelector from './PeriodSelector'

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardHeader({ periodLabel, selectedPeriod, onPeriodChange, customRange, onCustomRangeChange }) {
  return (
    <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Overview for {periodLabel.toLowerCase()}</p>
      </div>
      <PeriodSelector
        value={selectedPeriod}
        onChange={onPeriodChange}
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
      />
    </motion.div>
  )
}
