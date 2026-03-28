const variantStyles = {
  success: 'bg-success-50 text-success-700 border-success-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  info: 'bg-info-50 text-info-700 border-info-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}) {
  const dotColors = {
    success: 'bg-success-500',
    danger: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500',
    neutral: 'bg-slate-400',
    primary: 'bg-primary-500',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
