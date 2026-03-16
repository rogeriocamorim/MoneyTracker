import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    containerClassName = '',
    size = 'md',
    ...props
  },
  ref
) {
  const sizeClasses = {
    sm: 'py-1.5 text-xs',
    md: 'py-2.5 text-sm',
    lg: 'py-3 text-base',
  }

  const inputClasses = `
    w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
    rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
    placeholder:text-[var(--color-text-muted)]
    transition-all duration-[var(--transition-fast)]
    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-muted)]' : ''}
    ${Icon ? 'pl-10' : 'pl-3.5'}
    ${IconRight ? 'pr-10' : 'pr-3.5'}
    ${sizeClasses[size]}
    ${className}
  `

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            <IconRight className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
})

export default Input
