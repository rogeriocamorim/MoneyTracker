import { PackageOpen } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No data yet',
  description,
  action,
  actionLabel = 'Get started',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-bg-muted)] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size="sm" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
