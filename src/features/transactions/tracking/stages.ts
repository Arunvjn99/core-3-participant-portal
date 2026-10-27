export type TrackedType = 'loan' | 'withdrawal' | 'transfer' | 'rebalance' | 'rollover'
export type PayoutMethod = 'check' | 'eft'

export interface StageDef {
  /** i18n key suffix under `tracking.stage.*` */
  key: string
  /** Hours after submission at which this stage is reached (estimate until a backend feed exists) */
  atHours: number
  /** Short helper text key suffix under `tracking.detail.*` shown while this is the current stage */
  detailKey?: string
}

const H = 1
const D = 24

/** Stage plan per transaction type. Payout stages depend on how the participant is paid. */
export function stagesFor(type: TrackedType, method?: PayoutMethod): StageDef[] {
  const payout: StageDef[] =
    method === 'check'
      ? [
          { key: 'check_mailed', atHours: 3 * D, detailKey: 'check_mailed' },
          { key: 'check_delivered', atHours: 8 * D, detailKey: 'check_delivered' },
        ]
      : [
          { key: 'funds_sent', atHours: 3 * D, detailKey: 'funds_sent' },
          { key: 'funds_received', atHours: 5 * D },
        ]

  switch (type) {
    case 'loan':
    case 'withdrawal':
      return [
        { key: 'submitted', atHours: 0 },
        { key: 'under_review', atHours: 2 * H, detailKey: 'under_review' },
        { key: 'approved', atHours: 2 * D },
        ...payout,
      ]
    case 'transfer':
      return [
        { key: 'submitted', atHours: 0 },
        { key: 'trade_placed', atHours: 1 * H, detailKey: 'trade_placed' },
        { key: 'settled', atHours: 1 * D },
      ]
    case 'rebalance':
      return [
        { key: 'submitted', atHours: 0 },
        { key: 'trades_placed', atHours: 1 * H, detailKey: 'trade_placed' },
        { key: 'rebalanced', atHours: 1 * D },
      ]
    case 'rollover':
      return [
        { key: 'submitted', atHours: 0 },
        { key: 'docs_verified', atHours: 1 * D, detailKey: 'docs_verified' },
        { key: 'funds_requested', atHours: 2 * D, detailKey: 'funds_requested' },
        { key: 'funds_received', atHours: 10 * D },
        { key: 'invested', atHours: 11 * D },
      ]
  }
}
