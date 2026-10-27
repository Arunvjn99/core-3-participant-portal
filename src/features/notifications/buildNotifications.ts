import type { TFunction } from 'i18next'
import { getAppDateLocale } from '@/lib/dateLocale'
import type { ContributionLimitsResult } from '@/features/contributions/limits'
import type { TrackedTransaction, TransactionTimeline } from '@/features/transactions/tracking/timeline'
import type { AdviserMessage, Meeting } from '@/features/advisors/collab/collabStore'
import type { ServiceRequest, ServiceStatus } from '@/features/support/serviceCatalog'

export type Severity = 'action' | 'warning' | 'info' | 'success'

export interface AppNotification {
  /** Stable per source *and state*, so a new transaction stage produces a new (unread) notification */
  id: string
  severity: Severity
  /** Time the underlying event happened; used for ordering within a severity */
  at: number
  href?: string
  ctaKey?: string
  render: (t: TFunction, fmtDate: (ms: number) => string) => { title: string; body?: string }
}

export interface NotificationInputs {
  tracked: { tx: TrackedTransaction; timeline: TransactionTimeline }[]
  limits: ContributionLimitsResult
  adviser?: { unreadMessages: AdviserMessage[]; upcomingMeetings: Meeting[] }
  serviceRequests?: { req: ServiceRequest; timeline: TransactionTimeline; status: ServiceStatus }[]
  now?: number
}

const SEVERITY_RANK: Record<Severity, number> = { action: 0, warning: 1, info: 2, success: 3 }

/** Start of the current calendar quarter — the statement for the previous quarter is "ready" from then. */
function quarterStart(now: number): { at: number; label: string } {
  const d = new Date(now)
  const q = Math.floor(d.getMonth() / 3)
  const prevQ = (q + 3) % 4
  const year = q === 0 ? d.getFullYear() - 1 : d.getFullYear()
  return { at: new Date(d.getFullYear(), q * 3, 1).getTime(), label: `${year}-Q${prevQ + 1}` }
}

/**
 * Pure: derives homepage notifications from what the app already knows. Add a new source by pushing
 * another item here; id/severity/render are the whole contract. Replace inputs with a server feed later.
 */
export function buildNotifications({ tracked, limits, adviser, serviceRequests, now = Date.now() }: NotificationInputs): AppNotification[] {
  const out: AppNotification[] = []

  // Required action: beneficiary (mirrors the "required" item already shown in Next Best Actions).
  out.push({
    id: 'bene-required',
    severity: 'action',
    at: now,
    href: '/profile',
    ctaKey: 'alerts.cta_add_beneficiary',
    render: (t) => ({ title: t('alerts.bene_title'), body: t('alerts.bene_body') }),
  })

  // Employer match left on the table.
  if (limits.match.gapPercent > 0) {
    out.push({
      id: `match-gap:${limits.match.gapPercent}`,
      severity: 'warning',
      at: now,
      href: '/enrollment/contribution',
      ctaKey: 'alerts.cta_raise_rate',
      render: (t) => ({
        title: t('alerts.match_title', { amount: `$${limits.match.missedAnnual.toLocaleString()}` }),
        body: t('alerts.match_body', { pct: limits.match.capPercent }),
      }),
    })
  }

  // Approaching / reaching the annual limit.
  if (limits.reachesLimit || limits.percentUsed >= 85) {
    out.push({
      id: `limit-near:${limits.year}`,
      severity: 'info',
      at: now,
      href: '/post-enrollment-dashboard',
      render: (t) => ({
        title: t('alerts.limit_title', { year: limits.year }),
        body: t(limits.reachesLimit ? 'alerts.limit_body_reaches' : 'alerts.limit_body_near', {
          remaining: `$${limits.remaining.toLocaleString()}`,
        }),
      }),
    })
  }

  // Transaction status changes.
  for (const { tx, timeline } of tracked) {
    const step = timeline.steps[timeline.currentIndex]
    if (timeline.complete) {
      out.push({
        id: `tx:${tx.id}:complete`,
        severity: 'success',
        at: step.at,
        href: '/transactions',
        render: (t) => ({ title: t('alerts.tx_complete_title', { type: t(`tracking.type.${tx.type}`) }) }),
      })
    } else {
      out.push({
        id: `tx:${tx.id}:${step.key}`,
        severity: 'info',
        at: step.at,
        href: '/transactions',
        ctaKey: 'alerts.cta_track',
        render: (t, fmt) => ({
          title: t('alerts.tx_update_title', { type: t(`tracking.type.${tx.type}`), stage: t(`tracking.stage.${step.key}`) }),
          body: step.detailKey ? t(`tracking.detail.${step.detailKey}`) : t('tracking.expected_by', { date: fmt(timeline.expectedAt) }),
        }),
      })
    }
  }

  // Adviser: unread messages and a meeting coming up within 48 hours.
  for (const m of adviser?.unreadMessages ?? []) {
    out.push({
      id: `adv-msg:${m.id}`,
      severity: 'info',
      at: m.at,
      href: '/advisor?tab=messages',
      ctaKey: 'alerts.cta_read_message',
      render: (t) => ({ title: t('alerts.adviser_message_title'), body: t('alerts.adviser_message_body') }),
    })
  }
  for (const m of adviser?.upcomingMeetings ?? []) {
    if (m.at - now > 48 * 3_600_000) continue
    out.push({
      id: `adv-meet:${m.id}`,
      severity: 'info',
      at: now,
      href: '/advisor?tab=meetings',
      render: (t) => ({
        title: t('alerts.adviser_meeting_title'),
        body: new Date(m.at).toLocaleString(getAppDateLocale(), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      }),
    })
  }

  // Service requests: stage changes while open, and resolution.
  for (const { req, timeline, status } of serviceRequests ?? []) {
    if (status === 'cancelled') continue
    const step = timeline.steps[timeline.currentIndex]
    if (status === 'resolved') {
      out.push({
        id: `sr:${req.id}:resolved`,
        severity: 'success',
        at: step.at,
        href: '/service-requests',
        render: (t) => ({ title: t('alerts.sr_resolved_title', { ref: req.ref }), body: req.subject }),
      })
    } else if (timeline.currentIndex > 0) {
      out.push({
        id: `sr:${req.id}:${step.key}`,
        severity: 'info',
        at: step.at,
        href: '/service-requests',
        ctaKey: 'alerts.cta_view_request',
        render: (t) => ({ title: t('alerts.sr_update_title', { ref: req.ref, stage: t(`support.stage.${step.key}`) }), body: req.subject }),
      })
    }
  }

  // Quarterly statement.
  const stmt = quarterStart(now)
  out.push({
    id: `stmt:${stmt.label}`,
    severity: 'info',
    at: stmt.at,
    href: '/documents',
    render: (t) => ({ title: t('nav.notification_stmt_title'), body: t('nav.notification_stmt_desc') }),
  })

  return out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.at - a.at)
}
