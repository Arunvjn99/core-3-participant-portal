import { useEffect, useState } from 'react'

/**
 * How much of the bottom of the window is taken by things a floating button must not cover, in px:
 * a page's sticky action bar (Back / Next, marked with `data-action-bar`) or the page footer once it scrolls into view.
 * Floating corner buttons sit this far up, plus a small gap.
 */
export function useBottomClearance(): number {
  const [clear, setClear] = useState(0)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const h = window.innerHeight
      let next = 0
      const footers = document.getElementsByTagName('footer')
      const footer = footers[footers.length - 1]
      if (footer) next = Math.max(next, h - footer.getBoundingClientRect().top)
      document.querySelectorAll<HTMLElement>('[data-action-bar]').forEach((el) => {
        const r = el.getBoundingClientRect()
        // Only a bar that is actually on screen at the bottom of the window
        if (r.height > 0 && r.top < h && r.bottom > h - 4) next = Math.max(next, h - r.top)
      })
      next = Math.max(0, Math.round(next))
      setClear((prev) => (prev === next ? prev : next))
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
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

  return clear
}
