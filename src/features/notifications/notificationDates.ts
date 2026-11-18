import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'

export const DAY_MS = 86_400_000

/** Date helpers shared by the bell panel and the Notifications page, in the app language. */
export function useNotificationDates() {
  const now = useNow()
  const locale = getAppDateLocale()
  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  const fmtFull = (ms: number) => new Date(ms).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  /** "Today", "Yesterday", "5 days ago"… months past 30 days. */
  const fmtAgo = (ms: number) => {
    const days = Math.max(0, Math.floor((now - ms) / DAY_MS))
    if (days < 2) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day')
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
    if (days < 30) return rtf.format(-days, 'day')
    if (days < 365) return rtf.format(-Math.floor(days / 30), 'month')
    return rtf.format(-Math.floor(days / 365), 'year')
  }
  return { now, fmtDate, fmtFull, fmtAgo }
}
