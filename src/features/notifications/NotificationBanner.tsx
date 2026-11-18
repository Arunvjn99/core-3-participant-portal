import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { SEVERITY_STYLE } from './severityStyle'
import { useNotifications } from './useNotifications'

const MAX_VISIBLE = 3

/** Homepage strip with the highest-priority notifications; each can be dismissed. */
export function NotificationBanner() {
  const { t } = useTranslation()
  const { items, dismiss } = useNotifications()
  const fmt = (ms: number) => new Date(ms).toLocaleDateString(getAppDateLocale(), { month: 'short', day: 'numeric' })

  if (items.length === 0) return null
  const visible = items.slice(0, MAX_VISIBLE)
  const hidden = items.length - visible.length

  return (
    <section aria-label={t('alerts.section_label')} className="mb-5 space-y-2.5">
      {visible.map((n) => {
        const { box, icon, Icon } = SEVERITY_STYLE[n.severity]
        const { title, body } = n.render(t, fmt)
        return (
          <div
            key={n.id}
            role={n.severity === 'action' ? 'alert' : 'status'}
            // Good news doesn't need a coloured bar: a white row with a green tick is enough
            className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3', n.severity === 'success' ? 'border-border-default bg-surface-card' : box)}
          >
            <Icon className={cn('h-[18px] w-[18px] shrink-0 self-start sm:self-center', icon)} aria-hidden />
            {/* Phones: message, details and link stacked; wider screens: all on one line */}
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-2">
              <p className="text-[13px] font-semibold text-text-primary">{title}</p>
              {body && <p className="mt-0.5 text-[12px] text-text-secondary sm:mt-0">{body}</p>}
              {n.href && n.ctaKey && (
                <Link to={n.href} className="group mt-1.5 inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-primary hover:underline sm:ml-auto sm:mt-0 dark:text-blue-300">
                  {t(n.ctaKey)}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(n.id)}
              aria-label={t('alerts.dismiss')}
              className="shrink-0 self-start rounded p-1 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary sm:self-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
      {hidden > 0 && (
        <Link
          to="/notifications"
          className="group ml-1 inline-flex min-h-8 items-center gap-0.5 rounded text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-blue-300"
        >
          {t('alerts.view_more', { count: hidden })}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
      )}
    </section>
  )
}

export default NotificationBanner
