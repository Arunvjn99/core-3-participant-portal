import { useState } from 'react'

/** A timestamp fixed at first render, so components can show "age" or "days ago" without calling Date.now() while rendering. */
export function useNow(): number {
  const [now] = useState(() => Date.now())
  return now
}
