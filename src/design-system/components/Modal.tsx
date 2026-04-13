import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { scaleIn } from '../motion/variants'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
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
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={cn(
                'w-full rounded-xl bg-surface-card shadow-modal',
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {(title) && (
                <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
                  {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
                  <button
                    onClick={onClose}
                    className="ml-auto rounded-md p-1 text-text-muted hover:bg-surface-page hover:text-text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal
