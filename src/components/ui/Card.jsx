import { forwardRef } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const Card = forwardRef(({ children, className = '', hover = false, padding = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-xl border border-slate-200
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

function StatCard({ label, value, icon: Icon, trend, trendLabel, iconColor = 'text-primary-500', iconBg = 'bg-primary-50', className = '' }) {
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus
  const trendColor = trendDirection === 'up' ? 'text-success-600' : trendDirection === 'down' ? 'text-danger-600' : 'text-slate-400'
  const trendBg = trendDirection === 'up' ? 'bg-success-50' : trendDirection === 'down' ? 'bg-danger-50' : 'bg-slate-50'

  return (
    <Card className={`${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold font-number text-slate-900">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded-full ${trendColor} ${trendBg}`}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default Card
export { StatCard }
