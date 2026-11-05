import { useEffect, useState } from 'react'

/**
 * How far the page footer has scrolled into view from the bottom of the window, in px.
 * Floating buttons add this to their bottom offset so they rise above the footer instead of sitting on it.
 */
export function useFooterLift(): number {
  const [lift, setLift] = useState(0)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const footers = document.getElementsByTagName('footer')
      const footer = footers[footers.length - 1]
      const next = footer ? Math.max(0, Math.round(window.innerHeight - footer.getBoundingClientRect().top)) : 0
      setLift((prev) => (prev === next ? prev : next))
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    // Capture so scrolling inside any container (not just the window) is noticed
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [])

  return lift
}
