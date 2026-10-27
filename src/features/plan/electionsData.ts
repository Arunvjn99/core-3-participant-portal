import { recommendedFunds, type RiskKey } from '@/features/enrollment/investmentCatalog'

export type Unit = 'percent' | 'dollar'
export type Cycle = 'calendar_year' | 'participant_date' | 'plan_year'
export type SourceKey = 'preTax' | 'roth'
export type InvestMode = 'plan_selected' | 'own' | 'risk_style'
export type RiskStyle = 'conservative' | 'moderate' | 'aggressive'

export const CYCLES: Cycle[] = ['calendar_year', 'participant_date', 'plan_year']
export const SOURCES: SourceKey[] = ['preTax', 'roth']

/** Plan rules (placeholders until plan configuration is available). */
export const PLAN_RULES = {
  /** Default deferral when "use plan deferral rate" is chosen */
  defaultRate: { preTax: 3, roth: 0 } as Record<SourceKey, number>,
  maxTotalPercent: 75,
  /** Plan year begins April 1 (month index 3) */
  planYearStartMonth: 3,
  autoIncrementMax: 10,
}

export interface Deferral {
  unit: Unit
  preTax: number
  roth: number
  usePlanRate: boolean
}

export interface AutoIncrease {
  enabled: boolean
  cycle: Cycle
  /** When false, one increment and cap apply to every source */
  sourceWise: boolean
  amount: Record<SourceKey, number>
  cap: Record<SourceKey, number>
}

export type Allocation = Record<string, number>

export interface InvestmentElection {
  mode: InvestMode
  /** Election applied to all sources, or the pre-tax source when applyAllSources is false */
  allocations: { all: Allocation; preTax: Allocation; roth: Allocation }
  applyAllSources: boolean
  autoRebalance: boolean
  sdbOptedIn: boolean
  /** Keep pre-tax and Roth SDB money in separate brokerage accounts */
  sdbTrackSeparately?: boolean
  riskStyle?: RiskStyle
}

export interface HistoryEntry {
  id: string
  at: number
  /** i18n key suffix under `plan.history.change_*` */
  change: 'enrollment' | 'deferral' | 'auto_increase' | 'investment' | 'sdb' | 'rebalance' | 'opt_out'
  /** Values for the translated `plan.history.detail_<change>` string */
  params: Record<string, string | number | boolean>
  by: 'participant' | 'plan_rule'
}

export const allocationFor = (risk: RiskKey): Allocation => Object.fromEntries(recommendedFunds(risk).map((f) => [f.ticker, f.allocation]))

/** The plan's default election when a participant does not choose their own investments. */
export const PLAN_DEFAULT_ALLOCATION: Allocation = allocationFor('balanced')

export const DEFAULT_DEFERRAL: Deferral = { unit: 'percent', preTax: 6, roth: 2, usePlanRate: false }

export const DEFAULT_AUTO_INCREASE: AutoIncrease = {
  enabled: true,
  cycle: 'calendar_year',
  sourceWise: false,
  amount: { preTax: 1, roth: 1 },
  cap: { preTax: 10, roth: 10 },
}

export const DEFAULT_INVESTMENT: InvestmentElection = {
  mode: 'plan_selected',
  allocations: { all: PLAN_DEFAULT_ALLOCATION, preTax: PLAN_DEFAULT_ALLOCATION, roth: PLAN_DEFAULT_ALLOCATION },
  applyAllSources: true,
  autoRebalance: false,
  sdbOptedIn: false,
}

const DAY = 86_400_000
export const seedHistory = (now: number): HistoryEntry[] => [
  { id: 'h3', at: now - 5 * DAY, change: 'deferral', params: { unit: 'percent', pre: 6, roth: 2 }, by: 'participant' },
  { id: 'h2', at: now - 40 * DAY, change: 'auto_increase', params: { enabled: true, sourceWise: false, pre: 1, preCap: 10, roth: 1, rothCap: 10 }, by: 'plan_rule' },
  { id: 'h1', at: now - 120 * DAY, change: 'enrollment', params: {}, by: 'plan_rule' },
]

export const totalOf = (a: Allocation) => Object.values(a).reduce((s, v) => s + v, 0)

/** Next time an auto increase happens, after `now`, for each cycle. */
export function nextIncreaseDate(cycle: Cycle, now: number, enrolledAt: number): Date {
  const n = new Date(now)
  if (cycle === 'calendar_year') return new Date(n.getFullYear() + 1, 0, 1)
  if (cycle === 'plan_year') {
    const thisYear = new Date(n.getFullYear(), PLAN_RULES.planYearStartMonth, 1)
    return thisYear.getTime() > now ? thisYear : new Date(n.getFullYear() + 1, PLAN_RULES.planYearStartMonth, 1)
  }
  const e = new Date(enrolledAt)
  const anniv = new Date(n.getFullYear(), e.getMonth(), e.getDate())
  return anniv.getTime() > now ? anniv : new Date(n.getFullYear() + 1, e.getMonth(), e.getDate())
}

/** Pay periods per year for each payroll frequency. */
export const PERIODS: Record<string, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }

/** Map the risk-questionnaire result to a catalogue risk level. */
export const STYLE_TO_RISK: Record<RiskStyle, RiskKey> = { conservative: 'conservative', moderate: 'balanced', aggressive: 'aggressive' }

export const QUESTIONS = ['horizon', 'drop', 'experience', 'goal', 'income'] as const
export const ANSWER_KEYS = ['a1', 'a2', 'a3', 'a4'] as const

/** Sum of 1–4 per answer: 5–9 conservative, 10–15 moderate, 16–20 aggressive. */
export function styleFromScore(score: number): RiskStyle {
  if (score <= 9) return 'conservative'
  if (score <= 15) return 'moderate'
  return 'aggressive'
}
