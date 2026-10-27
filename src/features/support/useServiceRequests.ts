import { useEffect, useMemo, useState } from 'react'
import { buildServiceTimeline, statusOf } from './serviceCatalog'
import { useServiceStore } from './serviceStore'

export function useServiceRequests() {
  const requests = useServiceStore((s) => s.requests)
  const seed = useServiceStore((s) => s.seed)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    seed()
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [seed])

  return useMemo(
    () =>
      requests
        .map((req) => {
          const timeline = buildServiceTimeline(req, now)
          return { req, timeline, status: statusOf(req, timeline) }
        })
        .sort((a, b) => Number(a.status === 'resolved' || a.status === 'cancelled') - Number(b.status === 'resolved' || b.status === 'cancelled') || b.req.submittedAt - a.req.submittedAt),
    [requests, now],
  )
}
