import Button from './Button'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="p-3 mb-4 bg-slate-100 rounded-xl">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action} variant="primary" size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
