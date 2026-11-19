import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { NotificationItem } from './NotificationItem'
import { useNotifications } from './useNotifications'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'
const PILL_SECONDARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-slate-900 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`

/** Every notification in one list, with Mark all as read and Clear all (which can be undone). */
export default function NotificationsPage() {
  const { t } = useTranslation()
  const notifications = useNotifications()
  const { items, unreadCount, isUnread, dismiss, markAllRead, clearAll, restore } = notifications
  const [cleared, setCleared] = useState<string[] | null>(null)

  // Leaving the page counts as having seen what was on it, the same as closing the bell panel
  const markRef = useRef(markAllRead)
  useEffect(() => {
    markRef.current = markAllRead
  })
  useEffect(() => () => markRef.current(), [])

  return (
    <AnimatedPage>
      <div className="w-full pb-6 pt-2 lg:pb-7 lg:pt-3">
        <Link to="/dashboard" className={cn('mb-3 inline-flex min-h-10 items-center gap-1.5 rounded-md text-[14px] font-semibold text-slate-600 transition-colors hover:text-text-primary dark:text-slate-300 dark:hover:text-white', FOCUS)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t('retirement.back')}
        </Link>
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('nav.notifications_title')}</h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
                  {t('nav.notifications_new', { count: unreadCount })}
                </span>
              )}
            </div>
            <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t('alerts.page_subtitle')}</p>
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className={PILL_SECONDARY}>
                  <CheckCheck className="h-4 w-4" aria-hidden />
                  {t('alerts.mark_all_read')}
                </button>
              )}
              <button type="button" onClick={() => setCleared(clearAll())} className={PILL_SECONDARY}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('alerts.clear_all')}
              </button>
            </div>
          )}
        </header>

        {/* Confirms Clear all and offers to take it back */}
        {cleared && cleared.length > 0 && (
          <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-white/10">
            <p className="text-[14px] text-text-primary">{t('alerts.cleared', { count: cleared.length })}</p>
            <button
              type="button"
              onClick={() => {
                restore(cleared)
                setCleared(null)
              }}
              className={cn('min-h-10 rounded-md px-2 text-[14px] font-semibold text-primary underline-offset-2 hover:underline dark:text-blue-300', FOCUS)}
            >
              {t('alerts.undo')}
            </button>
          </div>
        )}

        <section aria-label={t('nav.notifications_title')} className={cn(CARD, 'overflow-hidden')}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                <Bell className="h-5 w-5 text-slate-500 dark:text-slate-300" aria-hidden />
              </span>
              <p className="text-[15px] font-semibold text-text-primary">{t('alerts.empty')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    n={n}
                    unread={isUnread(n.id)}
                    variant="row"
                    onDismiss={() => {
                      dismiss(n.id)
                      setCleared(null)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AnimatedPage>
  )
}
