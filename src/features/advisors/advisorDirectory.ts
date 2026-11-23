/**
 * The plan's advisors: which plan types each one covers, and when each is free. The picker shows only advisors for
 * the participant's plans, and every advisor has their own open times (some are already booked).
 */
export type AdvisorPlan = '401k' | '457b'

export interface DirectoryAdvisor {
  id: string
  /** Initials and name are not translated; title, focus and bio are under `advisor_modal.dir.<id>` */
  name: string
  years: number
  rating: number
  plans: AdvisorPlan[]
}

export const ADVISORS: DirectoryAdvisor[] = [
  { id: 'sarah', name: 'Sarah Jenkins', years: 12, rating: 4.9, plans: ['401k'] },
  { id: 'elena', name: 'Elena Ruiz', years: 15, rating: 4.9, plans: ['401k', '457b'] },
  { id: 'marcus', name: 'Marcus Chen', years: 8, rating: 4.7, plans: ['401k'] },
  { id: 'priya', name: 'Priya Patel', years: 10, rating: 4.8, plans: ['457b'] },
]

/** Half-hour session starts, in minutes after midnight: mornings 9:00 to 11:30, afternoons 2:00 to 4:30 */
export const SLOT_MINUTES = [540, 570, 600, 630, 660, 690, 840, 870, 900, 930, 960, 990]

/** The next `n` weekdays, starting tomorrow */
export function nextWorkdays(n: number, from = Date.now()): Date[] {
  const days: Date[] = []
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  while (days.length < n) {
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Whether a slot is already booked: fixed per advisor and day, so the same times stay taken on every visit */
export function isTaken(advisorId: string, day: Date, minutes: number): boolean {
  const key = `${advisorId}|${isoDate(day)}|${minutes}`
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (h >>> 0) % 3 === 0
}

/** The advisor's next `count` open times over the coming week */
export function nextOpenSlots(advisorId: string, count: number, from = Date.now()): { day: Date; minutes: number }[] {
  const out: { day: Date; minutes: number }[] = []
  for (const day of nextWorkdays(7, from)) {
    for (const m of SLOT_MINUTES) {
      if (!isTaken(advisorId, day, m)) out.push({ day, minutes: m })
      if (out.length === count) return out
    }
  }
  return out
}

/** A slot's start time in the reader's language, e.g. "9:30 AM" */
export function slotLabel(minutes: number, locale: string): string {
  const d = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
}
