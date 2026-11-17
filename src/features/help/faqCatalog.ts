import type { ComponentType } from 'react'
import { Building2, HandCoins, PiggyBank, RefreshCcw, ShieldCheck, TrendingUp } from 'lucide-react'

export type FaqCategoryId = 'contributions' | 'match_vesting' | 'investments' | 'loans_withdrawals' | 'rollovers' | 'account_security'

export const FAQ_CATEGORIES: { id: FaqCategoryId; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'contributions', Icon: PiggyBank },
  { id: 'match_vesting', Icon: Building2 },
  { id: 'investments', Icon: TrendingUp },
  { id: 'loans_withdrawals', Icon: HandCoins },
  { id: 'rollovers', Icon: RefreshCcw },
  { id: 'account_security', Icon: ShieldCheck },
]

export interface FaqItem {
  /** Locale key under `faq.items`. For `shared` items it is also the entry id in the Core AI answers. */
  id: string
  category: FaqCategoryId
  /**
   * The question and answer come from `faqAnswers.ts` (the same text Core AI gives), so there is one English copy.
   * Only the Spanish wording lives in the locale file.
   */
  shared?: boolean
}

export const FAQ_ITEMS: FaqItem[] = [
  { id: '401k_basics', category: 'contributions', shared: true },
  { id: 'contribution_limits', category: 'contributions', shared: true },
  { id: 'roth_vs_traditional', category: 'contributions', shared: true },
  { id: 'change_rate', category: 'contributions' },
  { id: 'auto_increase', category: 'contributions' },

  { id: 'how_match_works', category: 'match_vesting' },
  { id: 'full_match', category: 'match_vesting' },
  { id: 'vested_balance', category: 'match_vesting', shared: true },
  { id: 'leave_unvested', category: 'match_vesting' },

  { id: 'change_investments', category: 'investments' },
  { id: 'target_date', category: 'investments' },
  { id: 'rebalancing', category: 'investments' },
  { id: 'fees', category: 'investments' },

  { id: 'plan_loans', category: 'loans_withdrawals', shared: true },
  { id: 'withdrawal_rules', category: 'loans_withdrawals', shared: true },
  { id: 'hardship', category: 'loans_withdrawals' },
  { id: 'track_request', category: 'loans_withdrawals' },

  { id: 'what_is_rollover', category: 'rollovers' },
  { id: 'roll_in', category: 'rollovers' },
  { id: 'direct_vs_indirect', category: 'rollovers' },
  { id: 'leaving_job', category: 'rollovers' },

  { id: 'beneficiary', category: 'account_security' },
  { id: 'password', category: 'account_security' },
  { id: 'documents', category: 'account_security' },
  { id: 'update_details', category: 'account_security' },
  { id: 'other_accounts', category: 'account_security' },
]
