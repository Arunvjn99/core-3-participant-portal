import { useEffect, useState } from 'react'

/**
 * True when a modal marked with data-app-blocking-overlay is mounted.
 * Prefer this over geometry-based scans — those often false-positive and hide the pill forever.
 */
export function useAppBlockingOverlay(): boolean {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const evaluate = () => {
      setBlocked(document.querySelector('[data-app-blocking-overlay]') !== null)
    }

    evaluate()
    const mo = new MutationObserver(evaluate)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-app-blocking-overlay'] })

    return () => mo.disconnect()
  }, [])

  return blocked
}
