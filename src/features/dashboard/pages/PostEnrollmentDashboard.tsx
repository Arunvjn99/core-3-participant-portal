import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { formatFirstNameForDisplay, getAuthenticatedFirstName } from '@/lib/userDisplayName'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import {
  TrendingUp,
  ArrowLeftRight,
  HandCoins,
  DollarSign,
  RefreshCcw,
  Calendar,
  PieChart,
  AlertTriangle,
  Target,
  CreditCard,
  CheckSquare,
  User,
  Shield,
  ArrowDownLeft,
  Building2,
  Mail,
  CalendarDays,
} from 'lucide-react'
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { PremiumBalanceChart } from '@/features/dashboard/components/PremiumBalanceChart'

/** Card shell — spec: 12px radius, #E5E7EB border, white bg, shadow, 20px padding */
function SpecCard({
  children,
  className = '',
  noPadding,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <div
      className={`rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${noPadding ? '' : 'p-5'} ${className}`}
    >
      {children}
    </div>
  )
}

/** Denser series + smooth curve reads as a continuous growth line (end matches headline balance). */
const balanceChartData = [
  { i: 0, value: 128000 },
  { i: 1, value: 128650 },
  { i: 2, value: 128420 },
  { i: 3, value: 129800 },
  { i: 4, value: 130950 },
  { i: 5, value: 130600 },
  { i: 6, value: 132100 },
  { i: 7, value: 133400 },
  { i: 8, value: 134200 },
  { i: 9, value: 135800 },
  { i: 10, value: 137100 },
  { i: 11, value: 138950 },
  { i: 12, value: 140200 },
  { i: 13, value: 141600 },
  { i: 14, value: 142893 },
]

function buildGreetingSubtitle(firstName: string): string {
  const h = new Date().getHours()
  let lead: string
  if (h >= 5 && h <= 11) lead = `Good morning, ${firstName}.`
  else if (h >= 12 && h <= 16) lead = `Good afternoon, ${firstName}.`
  else if (h >= 17 && h <= 20) lead = `Good evening, ${firstName}.`
  else lead = `Hey, ${firstName}.`
  return `${lead} Here's your retirement summary.`
}

const portfolioSegments = [
  { key: 'us', label: 'US STOCKS', pct: 55, amount: '$78,591', color: '#2563EB' },
  { key: 'intl', label: 'INTL STOCKS', pct: 25, amount: '$35,723', color: '#0D9488' },
  { key: 'bonds', label: 'BONDS', pct: 15, amount: '$21,433', color: '#16A34A' },
  { key: 'cash', label: 'CASH', pct: 5, amount: '$7,144', color: '#D1D5DB' },
]

export default function PostEnrollmentDashboard() {
  const { user } = useAuth()
  const { profile } = useUser()

  const firstName = useMemo(() => {
    const raw = getAuthenticatedFirstName(profile, user)
    return formatFirstNameForDisplay(raw)
  }, [profile, user])

  const subtitle = useMemo(() => buildGreetingSubtitle(firstName), [firstName])

  return (
    <AnimatedPage className="min-h-full">
      <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#111827]">
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page header */}
          <header className="border-b border-[#F3F4F6] pb-6">
            <h1 className="text-[28px] font-bold leading-tight text-[#111827]">Overview</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{subtitle}</p>
          </header>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
            {/* LEFT ~65% */}
            <div className="flex flex-col gap-5 lg:col-span-8">
              {/* Card 1: Total balance */}
              <SpecCard className="relative overflow-hidden">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Total Balance</p>
                    <p className="mt-1 text-[36px] font-bold leading-none tracking-tight text-[#111827]">$142,893</p>
                    <p className="mt-2 flex items-center gap-1 text-[14px] font-medium text-[#16A34A]">
                      <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                      4.2% this quarter
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
                    ON TRACK
                  </span>
                </div>

                <div className="h-[120px] w-full">
                  <PremiumBalanceChart data={balanceChartData} />
                </div>

                <div className="mt-5 grid grid-cols-1 divide-y divide-[#E5E7EB] border-t border-[#E5E7EB] pt-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:pt-5">
                  <div className="flex items-start gap-2 pb-4 sm:pb-0 sm:pr-4">
                    <span className="text-base" aria-hidden>
                      🔒
                    </span>
                    <p className="text-[12px] text-[#6B7280]">
                      <span className="text-[#6B7280]">Vested Balance: </span>
                      <span className="font-semibold text-[#111827]">$138,450</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2 py-4 sm:px-4 sm:py-0">
                    <span className="text-base" aria-hidden>
                      📅
                    </span>
                    <p className="text-[12px] text-[#6B7280]">
                      <span>Retirement: </span>
                      <span className="font-semibold text-[#111827]">Est. 2046</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2 pt-4 sm:pt-0 sm:pl-4">
                    <span className="text-base" aria-hidden>
                      ⚡
                    </span>
                    <p className="text-[12px] text-[#6B7280]">
                      <span>Vested: </span>
                      <span className="font-semibold text-[#111827]">100%</span>
                    </p>
                  </div>
                </div>
              </SpecCard>

              {/* Card 2: Quick Actions — one card, 4 tiles with dividers */}
              <div>
                <h2 className="mb-3 text-[16px] font-bold text-[#111827]">Quick Actions</h2>
                <SpecCard noPadding className="overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-[#E5E7EB] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    {(
                      [
                        {
                          Icon: HandCoins,
                          title: 'Take a Loan',
                          sub: 'Borrow up to $10,000',
                          hint: 'Typical approval: 1-3 days',
                          href: '/transactions/loan',
                          circle: 'bg-blue-100 text-blue-600',
                        },
                        {
                          Icon: DollarSign,
                          title: 'Withdraw Money',
                          sub: 'Available: $5,000',
                          hint: 'Tax impact: 10-20%',
                          href: '/transactions/withdrawal',
                          circle: 'bg-emerald-100 text-emerald-600',
                        },
                        {
                          Icon: ArrowLeftRight,
                          title: 'Transfer Funds',
                          sub: 'Reallocate balance',
                          hint: 'No fees or penalties',
                          href: '/transactions/transfer',
                          circle: 'bg-blue-100 text-blue-600',
                        },
                        {
                          Icon: RefreshCcw,
                          title: 'Roll Over',
                          sub: 'Consolidate savings',
                          hint: 'No tax penalty',
                          href: '/transactions/rollover',
                          circle: 'bg-emerald-100 text-emerald-600',
                        },
                      ] as const
                    ).map((tile) => (
                      <Link
                        key={tile.title}
                        to={tile.href}
                        className="relative block p-5 transition-colors hover:bg-[#F9FAFB]"
                      >
                        <span className="absolute right-3 top-3 text-lg text-[#9CA3AF]">›</span>
                        <div
                          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${tile.circle}`}
                        >
                          <tile.Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="pr-6 text-[13px] font-bold text-[#111827]">{tile.title}</p>
                        <p className="mt-1 text-[13px] font-medium text-[#2563EB]">{tile.sub}</p>
                        <p className="mt-0.5 text-[11px] text-[#6B7280]">{tile.hint}</p>
                      </Link>
                    ))}
                  </div>
                </SpecCard>
              </div>

              {/* Card 3: Monthly Contributions */}
              <SpecCard>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#16A34A]" aria-hidden />
                    <span className="text-[15px] font-bold text-[#111827]">Monthly Contributions</span>
                  </div>
                  <span className="text-[12px] text-[#6B7280]">October 2024</span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-[#6B7280]">You (8%)</p>
                    <p className="mt-1 text-[20px] font-bold text-[#2563EB]">$450</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div className="h-full w-[85%] rounded-full bg-[#2563EB]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B7280]">Employer (4%)</p>
                    <p className="mt-1 text-[20px] font-bold text-[#16A34A]">+$225</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div className="h-full w-[70%] rounded-full bg-[#16A34A]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B7280]">Total/Mo</p>
                    <p className="mt-1 text-[20px] font-bold text-[#111827]">$675</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </SpecCard>

              {/* Learning Hub */}
              <div>
                <h2 className="mb-3 text-[18px] font-bold text-[#111827]">Learning Hub</h2>
                <SpecCard noPadding className="overflow-hidden">
                  <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-[35%_minmax(0,1fr)]">
                    <div className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 p-6 md:min-h-0">
                      <img
                        src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-40"
                      />
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="flex justify-center gap-3 text-white/90">
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs">💰</span>
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs">🏠</span>
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs">📈</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center p-6 md:p-8">
                      <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#111827] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                        RETIREMENT PLANNING
                      </span>
                      <h3 className="text-[22px] font-bold text-[#111827]">Financial Wellness</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                        Master your money mindset with our comprehensive guide to building sustainable wealth.
                      </p>
                      <Link
                        to="/post-enrollment-dashboard"
                        className="mt-4 inline-flex w-fit items-center gap-1 text-[14px] font-semibold text-[#2563EB] underline-offset-2 hover:underline"
                      >
                        Know more →
                      </Link>
                    </div>
                  </div>
                </SpecCard>
              </div>

              {/* Card 4: Portfolio Allocation */}
              <SpecCard>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-[#6B7280]" aria-hidden />
                      <span className="text-[15px] font-bold text-[#111827]">Portfolio Allocation</span>
                    </div>
                    <p className="mt-0.5 pl-7 text-[12px] text-[#6B7280]">Current asset mix</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                    <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                    Moderately Aggressive
                  </div>
                </div>
                <div className="mb-1 flex justify-between px-0.5 text-[11px] text-[#9CA3AF]">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-md">
                  {portfolioSegments.map((s) => (
                    <div
                      key={s.key}
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      title={`${s.label} ${s.pct}%`}
                    />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {portfolioSegments.map((s) => (
                    <div key={s.key}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                          {s.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[16px] font-bold text-[#111827]">{s.pct}%</p>
                      <p className="text-[12px] text-[#6B7280]">{s.amount}</p>
                    </div>
                  ))}
                </div>
              </SpecCard>

              {/* Card 5: Recent Activity */}
              <SpecCard>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#111827]">Recent Activity</h3>
                  <Link to="/post-enrollment-dashboard" className="text-[13px] font-semibold text-[#2563EB] hover:underline">
                    View All →
                  </Link>
                </div>
                <ul className="divide-y divide-[#E5E7EB]">
                  <li className="flex gap-4 py-4 first:pt-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <ArrowDownLeft className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#111827]">Contribution</p>
                      <p className="text-[12px] text-[#6B7280]">Payroll Deduction</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#16A34A]">+$450.00</p>
                      <p className="text-[12px] text-[#6B7280]">Oct 15</p>
                    </div>
                  </li>
                  <li className="flex gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <Building2 className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#111827]">Employer Match</p>
                      <p className="text-[12px] text-[#6B7280]">Safe Harbor</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#16A34A]">+$225.00</p>
                      <p className="text-[12px] text-[#6B7280]">Oct 15</p>
                    </div>
                  </li>
                  <li className="flex gap-4 py-4 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                      <RefreshCcw className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#111827]">Rebalance</p>
                      <p className="text-[12px] text-[#6B7280]">Auto Quarterly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-medium text-[#6B7280]">Completed</p>
                      <p className="text-[12px] text-[#6B7280]">Oct 01</p>
                    </div>
                  </li>
                </ul>
              </SpecCard>
            </div>

            {/* RIGHT ~35% */}
            <aside className="flex flex-col gap-5 lg:col-span-4">
              {/* Hardship */}
              <SpecCard className="border-l-4 border-l-[#F59E0B] pl-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
                    <span className="text-[14px] font-bold text-[#111827]">Hardship Withdrawal</span>
                  </div>
                  <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#D97706]">
                    PENDING
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280]">Request #9901 · Submitted Oct 22</p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-[#E5E7EB]">
                  <div className="h-full w-[60%] rounded-sm bg-gradient-to-r from-amber-400 to-amber-500" />
                </div>
                <p className="mt-1 text-right text-[11px] text-[#6B7280]">Under Review</p>
              </SpecCard>

              {/* Readiness */}
              <SpecCard className="text-center">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Target className="h-5 w-5 text-[#16A34A]" aria-hidden />
                  <span className="text-[15px] font-bold text-[#111827]">Readiness Score</span>
                </div>
                <div className="relative mx-auto h-[140px] w-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="78%"
                      outerRadius="100%"
                      barSize={10}
                      data={[{ value: 80 }]}
                      startAngle={90}
                      endAngle={450}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: '#E5E7EB' }}
                        dataKey="value"
                        cornerRadius={6}
                        fill="#16A34A"
                        animationDuration={1000}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-[36px] font-bold leading-none text-[#111827]">80</span>
                    <span className="text-[14px] text-[#6B7280]">/100</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#16A34A]">
                  <span className="h-2 w-2 rounded-full bg-[#16A34A]" aria-hidden />
                  On Track
                </div>
                <p className="mx-auto mt-3 max-w-[260px] text-[12px] leading-relaxed text-[#6B7280]">
                  Projected to replace 76% of pre-retirement income.
                </p>
                <button
                  type="button"
                  className="mt-5 w-full rounded-lg bg-[#111827] py-3 text-sm font-semibold text-white transition hover:bg-[#1F2937]"
                >
                  Launch Simulator
                </button>
              </SpecCard>

              {/* Active Loan */}
              <SpecCard>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#2563EB]" aria-hidden />
                    <span className="text-[14px] font-bold text-[#111827]">Active Loan</span>
                  </div>
                  <button type="button" className="text-[12px] font-semibold text-[#2563EB] hover:underline">
                    Request New
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[13px] font-bold text-[#111827]">General Purpose #102</p>
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280]">Originated Jan 2022</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Remaining</p>
                    <p className="mt-1 text-[18px] font-bold text-[#111827]">$2,450</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Next Payment</p>
                    <p className="mt-1 text-[14px] font-bold text-[#111827]">
                      $125 · Nov 15
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-[3px] bg-[#E5E7EB]">
                  <div className="h-full w-[60%] rounded-[3px] bg-[#16A34A]" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-[#6B7280]">
                  <span>60% Paid Off</span>
                  <span>14 Payments Left</span>
                </div>
              </SpecCard>

              {/* Next Best Actions */}
              <SpecCard>
                <div className="mb-4 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-[#6B7280]" aria-hidden />
                  <span className="text-[14px] font-bold text-[#111827]">Next Best Actions</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-[12px] bg-[#FEF2F2] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <User className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-[#111827]">Add a Beneficiary</p>
                        <span className="shrink-0 rounded bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#DC2626]">
                          REQUIRED
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-[#6B7280]">Protect your assets today.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <Shield className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-[#111827]">Review Risk Tolerance</p>
                        <span className="text-lg text-[#9CA3AF]">›</span>
                      </div>
                      <p className="mt-1 text-[12px] text-[#6B7280]">Update your profile.</p>
                    </div>
                  </div>
                </div>
              </SpecCard>

              {/* Your Advisor */}
              <div
                className="overflow-hidden rounded-[12px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                style={{
                  background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
                }}
              >
                <div className="relative p-5 pt-6 text-white">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Sarah Jenkins"
                    className="absolute right-5 top-5 h-[70px] w-[70px] rounded-full border-2 border-white object-cover ring-2 ring-white/30"
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">Your Advisor</p>
                  <h3 className="mt-2 pr-20 text-[20px] font-bold">Sarah Jenkins</h3>
                  <p className="mt-1 text-[13px] text-blue-100">Senior Wealth Advisor</p>
                  <div className="mt-6 grid grid-cols-3 divide-x divide-white/20 text-center">
                    <div className="px-2">
                      <p className="text-[16px] font-bold">4.9</p>
                      <p className="text-[11px] text-white/70">Rating</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[16px] font-bold">12yr</p>
                      <p className="text-[11px] text-white/70">Experience</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[16px] font-bold">240+</p>
                      <p className="text-[11px] text-white/70">Clients</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-white/90">
                    Specializes in retirement planning and tax-efficient wealth strategies for professionals nearing retirement.
                  </p>
                  <div className="mt-5 flex gap-2.5">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-white py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <Mail className="h-4 w-4" aria-hidden />
                      Message
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2.5 text-sm font-semibold text-[#2563EB] transition hover:bg-blue-50"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      Schedule Call
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </AnimatedPage>
  )
}
