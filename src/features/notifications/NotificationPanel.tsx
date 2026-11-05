import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bell, X } from 'lucide-react'
import { useDialogA11y } from '@/lib/useDialogA11y'
import { getAppDateLocale } from '@/lib/dateLocale'
import { SEVERITY_STYLE } from './severityStyle'
import type { useNotifications } from './useNotifications'

const ease = [0.22, 1, 0.36, 1] as const

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  notifications: ReturnType<typeof useNotifications>
}

/** Slide-out panel from the right edge: the full list, with what's new marked until the panel closes. */
export function NotificationPanel({ open, onClose, notifications }: NotificationPanelProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const ref = useDialogA11y<HTMLDivElement>(open, onClose)
  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(getAppDateLocale(), { month: 'short', day: 'numeric' })
  const { items, unreadCount, isUnread, dismiss } = notifications

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
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
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
              {items.map((n, i) => {
                const { title, body } = n.render(t, fmtDate)
                const { icon, Icon } = SEVERITY_STYLE[n.severity]
                const unread = isUnread(n.id)
                return (
                  <motion.li
                    key={n.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.18 } }}
                    transition={{ duration: reduce ? 0 : 0.28, delay: reduce ? 0 : 0.08 + i * 0.04, ease }}
                    className={`group relative rounded-xl border transition-colors ${
                      unread ? 'border-primary/20 bg-primary/[0.04]' : 'border-border-default bg-surface-card'
                    } hover:bg-surface-elevated`}
                  >
                    <Link to={n.href ?? '/transactions'} onClick={onClose} className="flex gap-3 rounded-xl p-3.5 pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
                        <Icon className={`h-4 w-4 ${icon}`} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
                          <span className="block text-sm font-semibold text-text-primary">{title}</span>
                        </span>
                        {body && <span className="mt-0.5 block text-[13px] leading-snug text-text-secondary">{body}</span>}
                        <span className="mt-1.5 block text-xs text-text-muted">{fmtDate(n.at)}</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => dismiss(n.id)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-surface-page hover:text-text-primary focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={t('alerts.dismiss')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.li>
                )
              })}
              </AnimatePresence>
            </ul>

            <div className="border-t border-border-default px-4 py-3">
              <Link
                to="/transactions"
                onClick={onClose}
                className="flex h-10 items-center justify-center rounded-lg text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                {t('nav.notifications_view_activity')}
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
