import { forwardRef } from 'react'

/**
 * Card — versatile container with header/body/footer slots.
 *
 * Variants:
 *   default   – white bg + subtle border + shadow
 *   stat      – colored left border accent
 *   flat      – no shadow, border only
 */

const Card = forwardRef(function Card(
  { children, className = '', variant = 'default', padding = true, ...props },
  ref
) {
  const base =
    'rounded-[var(--radius-xl)] border border-[var(--color-border)] transition-colors duration-[var(--transition-base)]'

  const variants = {
    default: `bg-[var(--color-bg-subtle)] shadow-[var(--shadow-card)] ${padding ? 'p-5 sm:p-6' : ''}`,
    stat: `bg-[var(--color-bg-subtle)] shadow-[var(--shadow-card)] ${padding ? 'p-5 sm:p-6' : ''}`,
    flat: `bg-[var(--color-bg-subtle)] ${padding ? 'p-5 sm:p-6' : ''}`,
  }

  return (
    <div ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
})

function CardHeader({ children, className = '', action, ...props }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base font-semibold text-[var(--color-text-primary)] ${className}`} {...props}>
      {children}
    </h3>
  )
}

function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-[var(--color-text-muted)] mt-1 ${className}`} {...props}>
      {children}
    </p>
  )
}

function CardBody({ children, className = '', ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-[var(--color-border)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
export { CardHeader, CardTitle, CardDescription, CardBody, CardFooter }
