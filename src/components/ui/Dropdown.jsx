import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const menuId = useId()

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Keyboard handling: ESC to close, arrow keys to navigate
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.querySelector('button, [tabindex]')?.focus()
        return
      }
      if (!isOpen || !dropdownRef.current) return

      const items = dropdownRef.current.querySelectorAll('[role="menuitem"]')
      if (items.length === 0) return
      const currentIndex = Array.from(items).indexOf(document.activeElement)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        items[next]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        items[prev]?.focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        items[0]?.focus()
      } else if (e.key === 'End') {
        e.preventDefault()
        items[items.length - 1]?.focus()
      }
    },
    [isOpen]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  // Focus first item on open
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      requestAnimationFrame(() => {
        const firstItem = dropdownRef.current?.querySelector('[role="menuitem"]')
        firstItem?.focus()
      })
    }
  }, [isOpen])

  return (
    <div className="relative inline-flex">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
      >
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute top-full mt-1 z-50
              bg-[var(--color-bg-elevated)] border border-[var(--color-border)]
              rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]
              py-1 min-w-[180px] overflow-hidden
              ${align === 'right' ? 'right-0' : 'left-0'}
              ${className}
            `}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({
  children,
  icon: Icon,
  onClick,
  danger = false,
  className = '',
  ...props
}) {
  return (
    <button
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm text-left
        transition-colors duration-100
        focus:outline-none focus:bg-[var(--color-bg-hover)]
        ${danger
          ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] focus:bg-[var(--color-danger-muted)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
        }
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-[var(--color-border)]" />
}
