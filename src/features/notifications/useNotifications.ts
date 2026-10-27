import { useMemo } from 'react'
import { useContributionLimits } from '@/features/contributions/useContributionLimits'
import { useAdviser } from '@/features/advisors/collab/useAdviser'
import { useServiceRequests } from '@/features/support/useServiceRequests'
import { useTrackedTransactions } from '@/features/transactions/tracking/useTrackedTransactions'
import { buildNotifications } from './buildNotifications'
import { useNotificationState } from './notificationState'

export function useNotifications() {
  const tracked = useTrackedTransactions()
  const limits = useContributionLimits()
  const { unread, upcoming } = useAdviser()
  const serviceRequests = useServiceRequests()
  const dismissed = useNotificationState((s) => s.dismissed)
  const read = useNotificationState((s) => s.read)
  const dismiss = useNotificationState((s) => s.dismiss)
  const markRead = useNotificationState((s) => s.markRead)

  const items = useMemo(
    () => buildNotifications({ tracked, limits, adviser: { unreadMessages: unread, upcomingMeetings: upcoming }, serviceRequests }).filter((n) => !dismissed.includes(n.id)),
    [tracked, limits, unread, upcoming, serviceRequests, dismissed],
  )
  const unreadCount = useMemo(() => items.filter((n) => !read.includes(n.id)).length, [items, read])

  return {
    items,
    unreadCount,
    isUnread: (id: string) => !read.includes(id),
    dismiss,
    markAllRead: () => markRead(items.map((n) => n.id)),
  }
}
