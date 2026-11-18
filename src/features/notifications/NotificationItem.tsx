import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SEVERITY_STYLE } from './severityStyle'
import type { AppNotification } from './buildNotifications'
import { DAY_MS, useNotificationDates } from './notificationDates'

interface NotificationItemProps {
  n: AppNotification
  unread: boolean
  onDismiss: () => void
  /** Called when the notification's link is followed (the panel closes itself). */
  onNavigate?: () => void
  /** "card": a boxed row (bell panel); "row": a plain row inside a list card (Notifications page). */
  variant?: 'card' | 'row'
}

/** One notification: icon, title, details, when it happened, an optional link, and a dismiss button. */
export function NotificationItem({ n, unread, onDismiss, onNavigate, variant = 'card' }: NotificationItemProps) {
  const { t } = useTranslation()
  const { now, fmtDate, fmtFull, fmtAgo } = useNotificationDates()
  const { title, body } = n.render(t, fmtDate)
  const { icon, Icon } = SEVERITY_STYLE[n.severity]

  const content = (
    <>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
        <Icon className={`h-4 w-4 ${icon}`} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
          <span className="block text-sm font-semibold text-text-primary">{title}</span>
        </span>
        {body && <span className="mt-0.5 block text-[13px] leading-snug text-text-secondary">{body}</span>}
        <time dateTime={new Date(n.at).toISOString()} className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold first-letter:uppercase ${now - n.at < DAY_MS ? 'bg-blue-700 text-white' : 'bg-surface-elevated text-text-primary'}`}
            aria-hidden
          >
            {fmtAgo(n.at)}
          </span>
          <span className="font-medium text-text-secondary" aria-hidden>
            {fmtDate(n.at)}
          </span>
          <span className="sr-only first-letter:uppercase">{`${fmtAgo(n.at)}, ${fmtFull(n.at)}`}</span>
        </time>
      </span>
    </>
  )

  const card = variant === 'card'
  const inner = cn('flex gap-3 p-3.5 pr-10', card ? 'rounded-xl' : 'px-4 sm:px-5')

  return (
    <div
      className={cn(
        'group relative transition-colors',
        card &&
          (unread
            ? 'rounded-xl border border-[color:color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_4%,transparent)]'
            : 'rounded-xl border border-border-default bg-surface-card'),
        !card && unread && 'bg-[color:color-mix(in_srgb,var(--color-primary)_4%,transparent)]',
        n.href && 'hover:bg-surface-elevated',
      )}
    >
      {n.href ? (
        <Link to={n.href} onClick={onNavigate} className={cn(inner, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary')}>
          {content}
          <ChevronRight className="absolute bottom-3.5 right-3 h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary motion-reduce:transition-none" aria-hidden />
        </Link>
      ) : (
        <div className={inner}>{content}</div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-surface-page hover:text-text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        aria-label={t('alerts.dismiss')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
