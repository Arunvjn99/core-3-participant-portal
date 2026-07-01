// Mock financial profile — replace with Supabase query when financial tables exist
export type AllocationFund = {
  fund: string
  ticker: string
  percent: number
  value: number
  ytdReturn: number
}

export type UserFinancials = {
  totalBalance: number
  vestedBalance: number
  vestedPercent: number
  unvestedBalance: number
  maxLoan: number
  maxWithdrawal: number
  annualSalary: number
  currentContributionPercent: number
  allocation: AllocationFund[]
}

const MOCK_PROFILE = {
  totalBalance: 20_000,
  vestedBalance: 16_000,
  vestedPercent: 80,
  annualSalary: 75_000,
  currentContributionPercent: 5,
  allocation: [
    { fund: 'Target Date 2045', ticker: 'TDF45', percent: 60, value: 12_000, ytdReturn: 8.4 },
    { fund: 'US Large Cap Growth', ticker: 'USLCG', percent: 25, value: 5_000, ytdReturn: 12.1 },
    { fund: 'Bond Index Fund', ticker: 'BOND', percent: 15, value: 3_000, ytdReturn: 3.2 },
  ],
}

export function getUserFinancials(): UserFinancials {
  const { totalBalance, vestedBalance, annualSalary, currentContributionPercent, allocation } = MOCK_PROFILE
  const unvestedBalance = totalBalance - vestedBalance
  const vestedPercent = totalBalance > 0 ? Math.round((vestedBalance / totalBalance) * 100) : 0
  const maxLoan = Math.min(50_000, Math.round(vestedBalance * 0.5))
  const maxWithdrawal = Math.min(5_000, Math.round(vestedBalance * 0.3))
  return {
    totalBalance,
    vestedBalance,
    vestedPercent,
    unvestedBalance,
    maxLoan,
    maxWithdrawal,
    annualSalary,
    currentContributionPercent,
    allocation,
  }
}

// Rebalance target presets
export type TargetPreset = {
  id: string
  label: string
  description: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  funds: { fund: string; ticker: string; percent: number }[]
}

export const REBALANCE_PRESETS: TargetPreset[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: 'Capital preservation, lower volatility',
    riskLevel: 'conservative',
    funds: [
      { fund: 'Bond Index Fund', ticker: 'BOND', percent: 60 },
      { fund: 'US Large Cap Growth', ticker: 'USLCG', percent: 30 },
      { fund: 'Target Date 2045', ticker: 'TDF45', percent: 10 },
    ],
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Balanced growth and stability',
    riskLevel: 'moderate',
    funds: [
      { fund: 'Target Date 2045', ticker: 'TDF45', percent: 50 },
      { fund: 'US Large Cap Growth', ticker: 'USLCG', percent: 30 },
      { fund: 'Bond Index Fund', ticker: 'BOND', percent: 20 },
    ],
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: 'Maximum long-term growth',
    riskLevel: 'aggressive',
    funds: [
      { fund: 'US Large Cap Growth', ticker: 'USLCG', percent: 70 },
      { fund: 'Target Date 2045', ticker: 'TDF45', percent: 20 },
      { fund: 'Bond Index Fund', ticker: 'BOND', percent: 10 },
    ],
  },
]

// Enrollment plan definitions
export type EnrollmentPlan = {
  id: string
  label: string
  subtitle: string
  tags: string[]
  features: string[]
  badge?: string
  estimatedAnnualSavings: number
}

export const ENROLLMENT_PLANS: EnrollmentPlan[] = [
  {
    id: 'core_401k',
    label: 'CORE 401(k) Plan',
    subtitle: 'Pre-tax • Roth • After-tax',
    tags: ['Pre-tax', 'Roth', 'After-tax'],
    features: ['Employer match up to 4%', 'Higher contribution limits', 'More investment choices'],
    badge: 'Most Popular',
    estimatedAnnualSavings: 7_246,
  },
  {
    id: 'safe_harbor',
    label: 'CORE Safe Harbor 401(k)',
    subtitle: 'Pre-tax • Roth',
    tags: ['Pre-tax', 'Roth'],
    features: ['Guaranteed employer match', 'Immediate vesting', 'Great for max savings'],
    estimatedAnnualSavings: 6_512,
  },
  {
    id: 'basic_401k',
    label: 'CORE Basic 401(k)',
    subtitle: 'Pre-tax only',
    tags: ['Pre-tax'],
    features: ['Easy to manage', 'Lower fees', 'Good for getting started'],
    estimatedAnnualSavings: 5_310,
  },
]
