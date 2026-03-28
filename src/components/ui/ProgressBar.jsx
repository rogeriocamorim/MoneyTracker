export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  size = 'md',
  color = 'primary',
  showLabel = true,
  className = '',
}) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    danger: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500',
  }

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  // Auto color: green < 75%, amber 75-90%, red > 90%
  const autoColor = percent < 75 ? 'bg-success-500' : percent < 90 ? 'bg-warning-500' : 'bg-danger-500'
  const barColor = color === 'auto' ? autoColor : colorClasses[color]

  return (
    <div className={className}>
      {showLabel && (label || valueLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {valueLabel && <span className="text-sm font-number text-slate-500">{valueLabel}</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${barColor} rounded-full transition-all duration-500 ease-out ${sizeClasses[size]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
