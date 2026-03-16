/**
 * Spinner — loading indicator with multiple styles.
 */

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        border-[var(--color-accent)] border-t-transparent
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  )
}

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`
        bg-[var(--color-bg-muted)] rounded-[var(--radius-md)] animate-pulse
        ${className}
      `}
      {...props}
    />
  )
}

export function SpinnerOverlay({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  )
}
