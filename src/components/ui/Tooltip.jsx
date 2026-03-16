import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 400,
  className = '',
}) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef(null)
  const triggerRef = useRef(null)

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), delay)
  }

  const handleLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  if (!content) return children

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`
              absolute ${positionClasses[position]} z-[200]
              px-2 py-1 text-xs font-medium text-white
              bg-[var(--color-text-primary)] rounded-[var(--radius-md)]
              whitespace-nowrap pointer-events-none shadow-lg
              ${className}
            `}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
