export const PERIODS = ['last_3_months', 'last_6_months', 'year_to_date', 'last_year'] as const
export type StatementPeriod = (typeof PERIODS)[number]

/** Start and end of a statement period. */
export function periodRange(p: StatementPeriod, now: number): { from: Date; to: Date } {
  const n = new Date(now)
  if (p === 'last_3_months') return { from: new Date(n.getFullYear(), n.getMonth() - 3, n.getDate()), to: n }
  if (p === 'last_6_months') return { from: new Date(n.getFullYear(), n.getMonth() - 6, n.getDate()), to: n }
  if (p === 'year_to_date') return { from: new Date(n.getFullYear(), 0, 1), to: n }
  return { from: new Date(n.getFullYear() - 1, 0, 1), to: new Date(n.getFullYear() - 1, 11, 31) }
}

