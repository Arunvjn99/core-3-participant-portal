import { stagesFor, type PayoutMethod, type TrackedType } from './stages'

export interface TrackedTransaction {
  id: string
  type: TrackedType
  /** Display amount in dollars; omitted for rebalances */
  amount?: number
  /** Short description, e.g. "General purpose loan" */
  description: string
  method?: PayoutMethod
  submittedAt: number
}

export type StepState = 'done' | 'current' | 'upcoming'

export interface TimelineStep {
  key: string
  detailKey?: string
  state: StepState
  /** When the step happened (done/current) or is expected (upcoming) */
  at: number
}

export interface TransactionTimeline {
  steps: TimelineStep[]
  currentIndex: number
  complete: boolean
  /** Estimated completion time (final step) */
  expectedAt: number
}

const HOUR = 3_600_000

/**
 * Builds the timeline for a transaction at a point in time.
 * Today stage times come from the schedule in `stages.ts`; replace the body of this function with
 * real status events from the recordkeeper when a feed is available — the UI only consumes this shape.
 */
export function buildTimeline(tx: TrackedTransaction, now: number = Date.now()): TransactionTimeline {
  const defs = stagesFor(tx.type, tx.method)
  const reached = defs.map((d) => tx.submittedAt + d.atHours * HOUR <= now)
  const lastReached = reached.lastIndexOf(true)
  const complete = lastReached === defs.length - 1
  const currentIndex = Math.max(lastReached, 0)

  const steps = defs.map((d, i): TimelineStep => ({
    key: d.key,
    detailKey: d.detailKey,
    at: tx.submittedAt + d.atHours * HOUR,
    state: i < currentIndex || (complete && i === currentIndex) ? 'done' : i === currentIndex ? 'current' : 'upcoming',
  }))

  return { steps, currentIndex, complete, expectedAt: steps[steps.length - 1].at }
}
