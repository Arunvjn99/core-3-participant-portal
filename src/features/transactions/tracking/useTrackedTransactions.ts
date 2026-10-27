import { useEffect, useMemo, useState } from 'react'
import { useTransactionTracker } from './trackerStore'
import { buildTimeline } from './timeline'

const DAY = 86_400_000

/** Completed requests stay visible for this long so participants see the outcome. */
const KEEP_COMPLETED_MS = 3 * DAY

export function useTrackedTransactions() {
  const items = useTransactionTracker((s) => s.items)
  const seedDemo = useTransactionTracker((s) => s.seedDemo)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    seedDemo()
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [seedDemo])

  return useMemo(
    () =>
      items
        .map((tx) => ({ tx, timeline: buildTimeline(tx, now) }))
        .filter(({ timeline }) => !timeline.complete || now - timeline.expectedAt < KEEP_COMPLETED_MS)
        .sort((a, b) => Number(a.timeline.complete) - Number(b.timeline.complete) || b.tx.submittedAt - a.tx.submittedAt),
    [items, now],
  )
}
