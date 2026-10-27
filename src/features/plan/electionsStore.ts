import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { recommendedFunds, type RiskKey } from '@/features/enrollment/investmentCatalog'
import {
  DEFAULT_AUTO_INCREASE, DEFAULT_DEFERRAL, DEFAULT_INVESTMENT, allocationFor, seedHistory,
  type Allocation, type AutoIncrease, type Deferral, type HistoryEntry, type InvestMode, type InvestmentElection, type RiskStyle, type Unit,
} from './electionsData'

const uid = () => `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`

interface EnrollmentValues {
  /** In `unit`: percent of pay, or dollars per paycheck */
  preTaxRate: number
  rothRate: number
  unit?: Unit
  autoIncrease?: { enabled: boolean; amount: number; max: number }
  /** Full auto-increase election (cycle, per-source amounts). Takes precedence over `autoIncrease`. */
  autoIncreaseFull?: AutoIncrease
  mode?: InvestMode
  riskStyle?: RiskStyle
  /** Set when the Roth source is invested differently from pre-tax */
  allocationRoth?: Allocation
  autoRebalance?: boolean
  sdbOptedIn?: boolean
  sdbTrackSeparately?: boolean
  risk?: RiskKey
  allocation?: Allocation
}

interface ElectionsState {
  deferral: Deferral
  autoIncrease: AutoIncrease
  investment: InvestmentElection
  history: HistoryEntry[]
  optedOut: boolean
  enrolledAt: number
  seeded: boolean

  seed: () => void
  saveDeferral: (d: Deferral, a: AutoIncrease, changed: { deferral?: boolean; auto?: boolean }) => void
  saveInvestment: (i: InvestmentElection, extras?: { sdbChanged?: boolean; rebalanceChanged?: boolean }) => void
  optOut: () => void
  /** Called when the participant finishes enrolment, so the plan page reflects what they chose. */
  applyEnrollment: (v: EnrollmentValues) => void
}

export const useElectionsStore = create<ElectionsState>()(
  persist(
    (set, get) => ({
      deferral: DEFAULT_DEFERRAL,
      autoIncrease: DEFAULT_AUTO_INCREASE,
      investment: DEFAULT_INVESTMENT,
      history: [],
      optedOut: false,
      enrolledAt: Date.now() - 120 * 86_400_000,
      seeded: false,

      seed: () => {
        if (get().seeded) return
        set({ seeded: true, history: seedHistory(Date.now()) })
      },

      saveDeferral: (deferral, autoIncrease, changed) =>
        set((s) => {
          const now = Date.now()
          const entries: HistoryEntry[] = []
          if (changed.deferral) entries.push({ id: uid(), at: now, change: 'deferral', params: { unit: deferral.unit, pre: deferral.preTax, roth: deferral.roth }, by: 'participant' })
          if (changed.auto)
            entries.push({
              id: uid(), at: now, change: 'auto_increase', by: 'participant',
              params: { enabled: autoIncrease.enabled, sourceWise: autoIncrease.sourceWise, pre: autoIncrease.amount.preTax, preCap: autoIncrease.cap.preTax, roth: autoIncrease.amount.roth, rothCap: autoIncrease.cap.roth },
            })
          return { deferral, autoIncrease, optedOut: false, history: [...entries, ...s.history] }
        }),

      saveInvestment: (investment, extras) =>
        set((s) => {
          const now = Date.now()
          const entries: HistoryEntry[] = [{ id: uid(), at: now, change: 'investment', params: { mode: investment.mode, style: investment.riskStyle ?? '', all: investment.applyAllSources }, by: 'participant' }]
          if (extras?.sdbChanged) entries.push({ id: uid(), at: now, change: 'sdb', params: { on: investment.sdbOptedIn }, by: 'participant' })
          if (extras?.rebalanceChanged) entries.push({ id: uid(), at: now, change: 'rebalance', params: { on: investment.autoRebalance }, by: 'participant' })
          return { investment, history: [...entries, ...s.history] }
        }),

      optOut: () =>
        set((s) => ({
          optedOut: true,
          deferral: { ...s.deferral, preTax: 0, roth: 0, usePlanRate: false },
          history: [{ id: uid(), at: Date.now(), change: 'opt_out', params: {}, by: 'participant' }, ...s.history],
        })),

      applyEnrollment: (v) =>
        set((s) => {
          const now = Date.now()
          const allocation = v.allocation ?? (v.risk ? Object.fromEntries(recommendedFunds(v.risk).map((f) => [f.ticker, f.allocation])) : s.investment.allocations.all) ?? allocationFor('balanced')
          const ai = v.autoIncrease
          const unit = v.unit ?? 'percent'
          const history: HistoryEntry[] = [
            { id: uid(), at: now, change: 'enrollment', params: {}, by: 'participant' },
            { id: uid(), at: now, change: 'deferral', params: { unit, pre: v.preTaxRate, roth: v.rothRate }, by: 'participant' },
          ]
          if (v.sdbOptedIn) history.push({ id: uid(), at: now, change: 'sdb', params: { on: true }, by: 'participant' })
          if (v.autoRebalance) history.push({ id: uid(), at: now, change: 'rebalance', params: { on: true }, by: 'participant' })
          return {
            optedOut: false,
            enrolledAt: now,
            seeded: true,
            deferral: { unit, preTax: v.preTaxRate, roth: v.rothRate, usePlanRate: false },
            autoIncrease: v.autoIncreaseFull
              ? v.autoIncreaseFull
              : ai
              ? { ...s.autoIncrease, enabled: ai.enabled, sourceWise: false, amount: { preTax: ai.amount, roth: ai.amount }, cap: { preTax: ai.max, roth: ai.max } }
              : s.autoIncrease,
            investment: {
              ...s.investment,
              mode: v.mode ?? (v.allocation || v.risk ? 'own' : 'plan_selected'),
              allocations: { all: allocation, preTax: allocation, roth: v.allocationRoth ?? allocation },
              applyAllSources: !v.allocationRoth,
              riskStyle: v.riskStyle ?? s.investment.riskStyle,
              autoRebalance: v.autoRebalance ?? s.investment.autoRebalance,
              sdbOptedIn: v.sdbOptedIn ?? s.investment.sdbOptedIn,
              sdbTrackSeparately: v.sdbTrackSeparately ?? s.investment.sdbTrackSeparately,
            },
            history,
          }
        }),
    }),
    { name: 'plan_elections', storage: createJSONStorage(() => localStorage) },
  ),
)
