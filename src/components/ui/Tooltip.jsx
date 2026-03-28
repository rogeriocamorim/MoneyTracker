import { useState, useRef } from 'react'

export default function Tooltip({ children, content, position = 'top', delay = 200 }) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef(null)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), delay)
  }

  const handleLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  if (!content) return children

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={`
            absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white
            bg-slate-800 rounded-lg shadow-lg whitespace-nowrap
            animate-fade-in pointer-events-none
            ${positionClasses[position]}
          `}
        >
          {content}
        </div>
      )}
    </div>
  )
}
