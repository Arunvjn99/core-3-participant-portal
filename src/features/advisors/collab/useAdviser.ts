import { useEffect, useMemo, useState } from 'react'
import { useCollabStore } from './collabStore'

/** Seeds the demo thread once and derives unread / upcoming items. */
export function useAdviser() {
  const store = useCollabStore()
  const { seed, messages, meetings, lastReadAt } = store
  const [now] = useState(() => Date.now())

  useEffect(() => {
    seed()
  }, [seed])

  const unread = useMemo(() => messages.filter((m) => m.from === 'adviser' && m.at > lastReadAt), [messages, lastReadAt])
  const upcoming = useMemo(() => meetings.filter((m) => m.at > now), [meetings, now])

  return { ...store, unread, upcoming, nextMeeting: upcoming[0] }
}
