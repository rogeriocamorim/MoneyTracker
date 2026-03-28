import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  type = 'text',
  size = 'md',
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

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
        <input
          ref={ref}
          type={inputType}
          className={`
            block w-full rounded-lg border bg-white
            transition-colors duration-150 ease-in-out
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
            ${error ? 'border-danger-300 focus:ring-danger-500/40 focus:border-danger-500' : 'border-slate-200 hover:border-slate-300'}
            ${Icon ? 'pl-10' : ''}
            ${isPassword || IconRight ? 'pr-10' : ''}
            ${type === 'number' ? 'font-number' : ''}
            ${sizeClasses[size]}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {IconRight && !isPassword && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <IconRight className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
