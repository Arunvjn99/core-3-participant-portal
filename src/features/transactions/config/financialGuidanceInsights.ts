import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, DollarSign, Target, TrendingUp } from 'lucide-react'

export type FinancialGuidanceInsightId =
  | 'employer_match'
  | 'loan_impact'
  | 'next_payment'
  | 'retirement_outlook'

export type FinancialGuidanceBadgeType = 'opportunity' | 'warning' | 'info' | 'positive'

export type FinancialGuidanceIconKey = 'trending-up' | 'alert-triangle' | 'dollar-sign' | 'target'

export type FinancialGuidanceInsightDef = {
  id: FinancialGuidanceInsightId
  badgeType: FinancialGuidanceBadgeType
  iconKey: FinancialGuidanceIconKey
}

export const FINANCIAL_GUIDANCE_INSIGHTS: readonly FinancialGuidanceInsightDef[] = [
  { id: 'employer_match', badgeType: 'opportunity', iconKey: 'trending-up' },
  { id: 'loan_impact', badgeType: 'warning', iconKey: 'alert-triangle' },
  { id: 'next_payment', badgeType: 'info', iconKey: 'dollar-sign' },
  { id: 'retirement_outlook', badgeType: 'positive', iconKey: 'target' },
] as const

export const GUIDANCE_ICON_MAP: Record<FinancialGuidanceIconKey, LucideIcon> = {
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign,
  target: Target,
}
