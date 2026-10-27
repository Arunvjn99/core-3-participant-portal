import type { TransactionTimeline } from '@/features/transactions/tracking/timeline'

export type ServiceCategory =
  | 'personal_info'
  | 'beneficiary'
  | 'document'
  | 'contribution'
  | 'loan_withdrawal'
  | 'access'
  | 'other'

/** Target resolution time, in business days, shown to the participant. Placeholder SLAs. */
export const CATEGORIES: { id: ServiceCategory; businessDays: number }[] = [
  { id: 'personal_info', businessDays: 2 },
  { id: 'beneficiary', businessDays: 2 },
  { id: 'document', businessDays: 1 },
  { id: 'contribution', businessDays: 2 },
  { id: 'loan_withdrawal', businessDays: 3 },
  { id: 'access', businessDays: 1 },
  { id: 'other', businessDays: 3 },
]

export type ContactPreference = 'email' | 'phone' | 'portal'

export interface ServiceRequest {
  id: string
  /** Human-readable reference, e.g. SR-2026-1004 */
  ref: string
  category: ServiceCategory
  subject: string
  details: string
  contact: ContactPreference
  submittedAt: number
  cancelledAt?: number
  notes: { at: number; text: string }[]
}

export type ServiceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled'

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function businessDaysFor(category: ServiceCategory): number {
  return CATEGORIES.find((c) => c.id === category)?.businessDays ?? 3
}

/** Adds business days (skipping Saturdays and Sundays). */
export function addBusinessDays(from: number, days: number): number {
  const d = new Date(from)
  let left = days
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1
  }
  return d.getTime()
}

/**
 * Timeline for a request at a point in time, in the shape the timeline component consumes.
 * Stage times follow the schedule below until a case-management system supplies real events.
 */
export function buildServiceTimeline(req: ServiceRequest, now: number): TransactionTimeline {
  const resolvedAt = Math.max(addBusinessDays(req.submittedAt, businessDaysFor(req.category)), req.submittedAt + 36 * HOUR)
  const plan = [
    { key: 'sr_received', at: req.submittedAt },
    { key: 'sr_assigned', at: req.submittedAt + 4 * HOUR, detailKey: 'sr_assigned' },
    { key: 'sr_in_progress', at: req.submittedAt + DAY, detailKey: 'sr_in_progress' },
    { key: 'sr_resolved', at: resolvedAt },
  ]
  const lastReached = plan.map((p) => p.at <= now).lastIndexOf(true)
  const complete = lastReached === plan.length - 1
  const currentIndex = Math.max(lastReached, 0)
  return {
    steps: plan.map((p, i) => ({
      key: p.key,
      detailKey: p.detailKey,
      at: p.at,
      state: i < currentIndex || (complete && i === currentIndex) ? 'done' : i === currentIndex ? 'current' : 'upcoming',
    })),
    currentIndex,
    complete,
    expectedAt: resolvedAt,
  }
}

export function statusOf(req: ServiceRequest, timeline: TransactionTimeline): ServiceStatus {
  if (req.cancelledAt) return 'cancelled'
  if (timeline.complete) return 'resolved'
  return timeline.currentIndex === 0 ? 'open' : 'in_progress'
}
