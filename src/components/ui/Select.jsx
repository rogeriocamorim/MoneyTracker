import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    options = [],
    placeholder = 'Select an option',
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

  const selectClasses = `
    w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]
    rounded-[var(--radius-lg)] text-[var(--color-text-primary)]
    px-3.5 appearance-none cursor-pointer
    transition-all duration-[var(--transition-fast)]
    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-muted)]' : ''}
    ${sizeClasses[size]}
    ${className}
  `

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select ref={ref} className={selectClasses} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value
            const label = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
        {/* Chevron icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
})

export default Select
