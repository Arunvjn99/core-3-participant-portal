import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { scaleIn } from '../motion/variants'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  '2xl': 'max-w-6xl',
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Keep the latest onClose without re-running the focus effect when a parent passes an inline function.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Escape closes; focus moves into the dialog and returns to the trigger on close.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-surface-overlay"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={cn(
                'flex max-h-[90vh] w-full flex-col rounded-xl bg-surface-card shadow-modal focus:outline-none',
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {(title) && (
                <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
                  {title && <h2 id={titleId} className="text-lg font-semibold text-text-primary">{title}</h2>}
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="ml-auto rounded-md p-1 text-text-muted hover:bg-surface-page hover:text-text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="overflow-y-auto p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal
