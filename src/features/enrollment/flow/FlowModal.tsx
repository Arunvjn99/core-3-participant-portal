import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * A compact, centred pop-up for one question or one setting at a time. Escape and the close button dismiss it,
 * focus stays inside while it's open and returns to where it was afterwards, and the page behind doesn't scroll.
 */
export function FlowModal({
  open,
  onClose,
  label,
  eyebrow,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  /** The question or setting, used as the dialog's heading */
  label: string
  /** A small line above the heading, e.g. "CORE AI needs one answer" */
  eyebrow?: string
  children: React.ReactNode
  footer: React.ReactNode
  /** A little wider, for pop-ups with side-by-side options */
  wide?: boolean
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, summary, a[href]')
      if (!items.length) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  // A new question in the same pop-up is announced too
  useEffect(() => {
    if (open) headingRef.current?.focus()
  }, [open, label])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="flow-modal" className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-app-blocking-overlay>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="flow-modal-title"
            initial={reduce ? false : { y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 360 }}
            className={cn('relative w-full overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)] dark:bg-gray-900 sm:rounded-3xl', wide ? 'max-w-xl' : 'max-w-md')}
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div className="min-w-0">
                {eyebrow && (
                  <p className="text-blue-700 dark:text-blue-300" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {eyebrow}
                  </p>
                )}
                <h2 id="flow-modal-title" ref={headingRef} tabIndex={-1} className="mt-1 text-slate-900 dark:text-white" style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3, outline: 'none' }}>
                  {label}
                </h2>
              </div>
              <button type="button" onClick={onClose} aria-label={t('glossary.close')} className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 pb-2 pt-4">{children}</div>
            <div className="flex items-center gap-3 px-6 pb-6 pt-4">{footer}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
