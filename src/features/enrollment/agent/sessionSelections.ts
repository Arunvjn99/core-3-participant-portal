import { useEffect } from 'react'

/**
 * Keeps the participant's one-click choices for the browser session, so a reload, a failed submission or a trip to
 * another page doesn't lose them. Consent is deliberately not saved: it must be given again each time.
 */
const KEY = 'quick_enrol_selections_v1'

export function loadSelections<T extends object>(): Partial<T> | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<T>) : null
  } catch {
    return null
  }
}

export function clearSelections() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* storage unavailable; nothing to clear */
  }
}

/** Saves `value` whenever it changes, unless `enabled` is false (e.g. before the plan has been prepared). */
export function useSaveSelections(value: object, enabled: boolean) {
  const json = JSON.stringify(value)
  useEffect(() => {
    if (!enabled) return
    try {
      sessionStorage.setItem(KEY, json)
    } catch {
      /* storage unavailable or full; selections stay in memory only */
    }
  }, [json, enabled])
}
