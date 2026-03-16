import { useState, useEffect } from 'react'

/**
 * Hook that tracks a CSS media query.
 * @param {string} query - CSS media query string, e.g. '(min-width: 1024px)'
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)

    // Set initial value
    setMatches(mql.matches)

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Convenience hook: returns true when viewport >= 1024px (lg breakpoint)
 */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Convenience hook: returns true when viewport >= 768px (md breakpoint)
 */
export function useIsTablet() {
  return useMediaQuery('(min-width: 768px)')
}

/**
 * Convenience hook: returns true when viewport < 768px
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
