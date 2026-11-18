import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bell, X, ChevronRight } from 'lucide-react'
import { useDialogA11y } from '@/lib/useDialogA11y'
import { NotificationItem } from './NotificationItem'
import type { useNotifications } from './useNotifications'

const ease = [0.22, 1, 0.36, 1] as const
/** How many the bell panel lists before pointing to the Notifications page for the rest. */
export const PANEL_LIMIT = 5

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  notifications: ReturnType<typeof useNotifications>
}

/** Slide-out panel from the right edge: the latest notifications, with what's new marked until the panel closes. */
export function NotificationPanel({ open, onClose, notifications }: NotificationPanelProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const ref = useDialogA11y<HTMLDivElement>(open, onClose)
  const { items, unreadCount, isUnread, dismiss } = notifications
  const shown = items.slice(0, PANEL_LIMIT)
  const more = items.length - shown.length

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-panel-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-surface-card shadow-[-24px_0_60px_-30px_rgba(11,21,51,0.45)] sm:border-l sm:border-border-default"
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reduce ? 0 : 0.32, ease }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-default px-5 py-4">
              <div className="flex items-center gap-2.5">
                <h2 id="notification-panel-title" className="text-[17px] font-bold text-text-primary">
                  {t('nav.notifications_title')}
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-2 py-0.5 text-xs font-semibold text-primary">
                    {t('nav.notifications_new', { count: unreadCount })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {items.length === 0 && (
                <li className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
                    <Bell className="h-5 w-5 text-text-muted" aria-hidden />
                  </span>
                  <span className="text-sm text-text-secondary">{t('alerts.empty')}</span>
                </li>
              )}
              <AnimatePresence initial={false}>
                {shown.map((n, i) => (
                  <motion.li
                    key={n.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.18 } }}
                    transition={{ duration: reduce ? 0 : 0.28, delay: reduce ? 0 : 0.08 + i * 0.04, ease }}
                  >
                    <NotificationItem n={n} unread={isUnread(n.id)} onDismiss={() => dismiss(n.id)} onNavigate={onClose} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {/* Past the first few, the rest live on the Notifications page (which also has Clear all) */}
            {more > 0 && (
              <div className="border-t border-border-default px-4 py-3">
                <Link
                  to="/notifications"
                  onClick={onClose}
                  className="group flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold text-primary ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-blue-300 dark:ring-white/15 dark:hover:bg-white/5"
                >
                  {t('nav.notifications_view_more', { count: more })}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
