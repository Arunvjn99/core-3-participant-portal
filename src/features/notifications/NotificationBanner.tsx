import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
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
          <div key={n.id} role={n.severity === 'action' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-[12px] border p-3.5', box)}>
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-text-primary">{title}</p>
              {body && <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">{body}</p>}
              {n.href && n.ctaKey && (
                <Link to={n.href} className="mt-1.5 inline-block text-[12px] font-semibold text-primary hover:underline">
                  {t(n.ctaKey)}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(n.id)}
              aria-label={t('alerts.dismiss')}
              className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
      {hidden > 0 && <p className="px-1 text-[12px] text-text-muted">{t('alerts.more_in_bell', { count: hidden })}</p>}
    </section>
  )
}

export default NotificationBanner
