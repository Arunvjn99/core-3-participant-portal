/**
 * Prototype demo: five participants, one for each enrollment situation, so every dashboard can be shown without
 * changing data by hand. Each one sets who is signed in, their details and where they stand with the plan.
 */
export type DemoStatus = 'auto_enrolled' | 'not_eligible' | 'eligible' | 'enrolled' | 'opted_out'

export interface DemoPersona {
  id: string
  firstName: string
  lastName: string
  email: string
  /** ISO date, YYYY-MM-DD */
  dob: string
  status: DemoStatus
  salary: number
  /** Account and vested balance; left out for participants with nothing saved yet */
  balance?: number
  vested?: number
  /** Enrolled: what they save, percent of pay (auto-enrolled: the plan's default rate) */
  rate?: number
  /** Not eligible: months until they can join */
  eligibleInMonths?: number
  /** Opted out: how many days ago */
  optedOutDaysAgo?: number
  /** Also eligible for the 457(b) plan; enrolled participants save `secondRate` there and hold `secondBalance` */
  twoPlans?: boolean
  secondRate?: number
  secondBalance?: number
  /** Soft tile colour behind the initials */
  tone: 'blue' | 'violet' | 'amber' | 'emerald'
}

export const PERSONAS: DemoPersona[] = [
  { id: 'auto', firstName: 'Liam', lastName: 'Carter', email: 'liam.carter@example.com', dob: '1996-04-12', status: 'auto_enrolled', salary: 62_000, balance: 12_840, vested: 9_620, rate: 3, tone: 'blue' },
  { id: 'ineligible', firstName: 'Sofia', lastName: 'Nguyen', email: 'sofia.nguyen@example.com', dob: '2001-08-30', status: 'not_eligible', salary: 48_000, eligibleInMonths: 2, tone: 'violet' },
  { id: 'eligible', firstName: 'Marcus', lastName: 'Reed', email: 'marcus.reed@example.com', dob: '1990-01-22', status: 'eligible', salary: 85_000, tone: 'amber' },
  { id: 'enrolled', firstName: 'Priya', lastName: 'Shah', email: 'priya.shah@example.com', dob: '1984-11-05', status: 'enrolled', salary: 112_000, rate: 8, tone: 'emerald' },
  { id: 'two-plans', firstName: 'Olivia', lastName: 'Bennett', email: 'olivia.bennett@example.com', dob: '1979-03-14', status: 'eligible', salary: 140_000, twoPlans: true, secondRate: 3, tone: 'violet' },
  { id: 'two-plans-enrolled', firstName: 'James', lastName: 'Whitfield', email: 'james.whitfield@example.com', dob: '1976-10-02', status: 'enrolled', salary: 165_000, rate: 10, balance: 318_400, vested: 300_100, twoPlans: true, secondRate: 5, secondBalance: 46_200, tone: 'amber' },
  { id: 'optout', firstName: 'Daniel', lastName: 'Ortiz', email: 'daniel.ortiz@example.com', dob: '1992-06-17', status: 'opted_out', salary: 71_000, optedOutDaysAgo: 24, tone: 'blue' },
]

/** Earlier ids, so a participant picked before the rename still resolves */
const LEGACY_IDS: Record<string, string> = { jordan: 'auto', kayla: 'ineligible', michael: 'eligible', ava: 'enrolled', noah: 'optout' }

export const personaById = (id: string | null | undefined) => {
  const key = id ? (LEGACY_IDS[id] ?? id) : id
  return PERSONAS.find((p) => p.id === key) ?? null
}

/** Enrolled and auto-enrolled participants see the enrolled dashboard; the rest see the one before enrolling */
export const isEnrolledStatus = (s: DemoStatus) => s === 'enrolled' || s === 'auto_enrolled'

export const initials = (p: DemoPersona) => `${p.firstName[0]}${p.lastName[0]}`

/** When a participant can join, or when they opted out, as a date in the reader's language */
export function personaDates(p: DemoPersona, locale: string, now = Date.now()) {
  const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
  const eligible = new Date(now)
  eligible.setMonth(eligible.getMonth() + (p.eligibleInMonths ?? 0), 1)
  const optedOut = new Date(now - (p.optedOutDaysAgo ?? 0) * 86_400_000)
  return { eligible: fmt(eligible), optedOut: fmt(optedOut) }
}
