import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, Search, X, Plus } from 'lucide-react'

export default function SearchSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  required = false,
  disabled = false,
  compact = false,
  error,
  hint,
  onCreateOption,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Flatten all options for lookup (supports both grouped and flat)
  const allFlat = useMemo(() => options.flatMap((o) => (o.options ? o.options : [o])), [options])
  const selected = allFlat.find((o) => o.value === value)

  // Filter then rebuild groups
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return options
      .map((item) => {
        if (item.options) {
          const children = q ? item.options.filter((o) => o.label.toLowerCase().includes(q)) : item.options
          return children.length > 0 ? { ...item, options: children } : null
        }
        return !q || item.label.toLowerCase().includes(q) ? item : null
      })
      .filter(Boolean)
  }, [options, query])

  const flatFiltered = useMemo(() => filtered.flatMap((o) => (o.options ? o.options : [o])), [filtered])

  // Show "Create X" when onCreateOption is provided and query doesn't exactly match an existing option
  const showCreateOption = useMemo(() => {
    if (!onCreateOption || !query.trim()) return false
    const q = query.trim().toLowerCase()
    return !allFlat.some((o) => o.label.toLowerCase() === q)
  }, [onCreateOption, query, allFlat])

  const handleSelect = (opt) => {
    onChange({ target: { value: opt.value } })
    setQuery('')
    setOpen(false)
  }

  const handleCreate = async () => {
    if (!onCreateOption || !query.trim()) return
    const result = await onCreateOption(query.trim())
    if (result?.value) {
      onChange({ target: { value: result.value } })
    }
    setQuery('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ target: { value: '' } })
    setQuery('')
  }

  const handleToggle = () => {
    if (disabled) return
    setOpen((prev) => !prev)
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleClickOutside = useCallback((e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setOpen(false)
      setQuery('')
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (flatFiltered.length === 1) {
        handleSelect(flatFiltered[0])
      } else if (flatFiltered.length === 0 && showCreateOption) {
        handleCreate()
      }
    }
  }

  const renderOption = (opt) => (
    <li
      key={opt.value}
      onClick={() => handleSelect(opt)}
      className={`
        ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'} cursor-pointer transition-colors
        ${opt.value === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}
      `}
    >
      {opt.label}
    </li>
  )

  return (
    <div className={compact ? '' : 'space-y-1.5'} ref={containerRef}>
      {!compact && label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            flex items-center w-full rounded-lg border bg-white text-left
            ${compact ? 'px-2 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'} transition-colors duration-150
            focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
            ${open ? 'border-primary-500 ring-1 ring-primary-500/40' : ''}
            ${error ? 'border-danger-300' : 'border-slate-200 hover:border-slate-300'}
            cursor-pointer
          `}
        >
          <span className={`flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
          {value && !disabled && (
            <X
              className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 hover:text-slate-600 mr-1 shrink-0`}
              onClick={handleClear}
            />
          )}
          <ChevronDown className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className={`absolute z-50 mt-1 ${compact ? 'min-w-[200px]' : 'w-full'} rounded-lg border border-slate-200 bg-white shadow-lg animate-fade-in`}>
            <div className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} border-b border-slate-100`}>
              <Search className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400 shrink-0`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className={`w-full ${compact ? 'text-xs' : 'text-sm'} bg-transparent outline-none placeholder:text-slate-400`}
              />
            </div>

            <ul className="max-h-48 overflow-y-auto py-1">
              {flatFiltered.length === 0 && !showCreateOption ? (
                <li className={`${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'} text-slate-400`}>No results found</li>
              ) : (
                <>
                  {filtered.map((item) => {
                    if (item.options) {
                      return (
                        <li key={item.label}>
                          <div className={`${compact ? 'px-2.5 pt-2 pb-0.5' : 'px-3.5 pt-3 pb-1'} text-[11px] font-semibold uppercase tracking-wider text-slate-400`}>
                            {item.label}
                          </div>
                          <ul>
                            {item.options.map(renderOption)}
                          </ul>
                        </li>
                      )
                    }
                    return renderOption(item)
                  })}
                  {showCreateOption && (
                    <li
                      onClick={handleCreate}
                      className={`
                        ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'}
                        cursor-pointer transition-colors text-primary-600 hover:bg-primary-50
                        flex items-center gap-1.5 font-medium border-t border-slate-100
                      `}
                    >
                      <Plus className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                      Create "{query.trim()}"
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      {!compact && error && <p className="text-xs text-danger-600">{error}</p>}
      {!compact && hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
