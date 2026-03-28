import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  size = 'md',
  icon: Icon,
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  }

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
        )}
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border bg-white appearance-none cursor-pointer
            transition-colors duration-150 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
            ${error ? 'border-danger-300 focus:ring-danger-500/40 focus:border-danger-500' : 'border-slate-200 hover:border-slate-300'}
            ${Icon ? 'pl-10' : ''}
            pr-10
            ${sizeClasses[size]}
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : opt
            return (
              <option key={value} value={value}>
                {optLabel}
              </option>
            )
          })}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
