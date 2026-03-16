const variantClasses = {
  default:
    'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]',
  success:
    'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  danger:
    'bg-[var(--color-danger-muted)] text-[var(--color-danger)]',
  warning:
    'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  info:
    'bg-[var(--color-info-muted)] text-[var(--color-info)]',
  accent:
    'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-[var(--radius-md)] gap-1
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      )}
      {children}
    </span>
  )
}
