import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function mediaQuery() {
  if (typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

function subscribe(onChange: () => void) {
  const query = mediaQuery()
  if (!query) return () => {}
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function snapshot() {
  return mediaQuery()?.matches ?? false
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
