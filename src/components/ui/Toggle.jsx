import { useState } from 'react'

export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  className = '',
}) {
  const sizeClasses = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
  }

  const s = sizeClasses[size]

  return (
    <label className={`inline-flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2
          ${s.track}
          ${checked ? 'bg-primary-500' : 'bg-slate-200'}
          ${disabled ? '' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out
            ${s.thumb}
            ${checked ? s.translate : 'translate-x-0.5'}
            mt-0.5
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {description && <span className="text-xs text-slate-500">{description}</span>}
        </div>
      )}
    </label>
  )
}
