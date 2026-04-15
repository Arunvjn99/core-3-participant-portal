import React, { useState, useEffect } from 'react'
import { supabase } from '@/core/supabase'
import {
  TrendingUp,
  Wallet,
  ChevronRight,
  ArrowRight,
  ArrowLeftRight,
  BookOpen,
  ShieldCheck,
  Zap,
  HelpCircle,
  Calendar,
  Briefcase,
  HandCoins,
  DollarSign,
  RefreshCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'

// --- Mock Data ---
const balanceData = [
  { name: 'Jan', value: 142000 },
  { name: 'Feb', value: 145000 },
  { name: 'Mar', value: 143500 },
  { name: 'Apr', value: 148000 },
  { name: 'May', value: 152000 },
  { name: 'Jun', value: 158420 },
]

const portfolioData = [
  { name: 'US Equities', value: 65, color: '#2563EB' },
  { name: 'Intl Equities', value: 20, color: '#60A5FA' },
  { name: 'Bonds', value: 10, color: '#BFDBFE' },
  { name: 'Cash', value: 5, color: '#DBEAFE' },
]

const activityData = [
  { id: 1, type: 'Contribution', date: 'Oct 24, 2023', amount: '+$1,250.00', status: 'Completed', icon: Wallet },
  { id: 2, type: 'Employer Match', date: 'Oct 24, 2023', amount: '+$625.00', status: 'Completed', icon: Briefcase },
  { id: 3, type: 'Dividend Reinvestment', date: 'Oct 15, 2023', amount: '+$142.30', status: 'Completed', icon: TrendingUp },
]

const nextActions = [
  { id: 1, title: 'Increase Contribution', description: 'You are $200 away from maximizing your employer match.', cta: 'Update Rate', type: 'warning' },
  { id: 2, title: 'Beneficiary Review', description: 'It has been over 12 months since your last beneficiary update.', cta: 'Review Now', type: 'info' },
]

// --- Components ---

const Card = ({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`premium-card ${className}`}
  >
    {title && <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
    {children}
  </motion.section>
)

const Badge = ({
  children,
  variant = 'success',
  icon: Icon,
}: {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'info'
  icon?: React.ComponentType<{ className?: string }>
}) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${styles[variant]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}

export default function PostEnrollmentDashboard() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name =
        (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
        (typeof user.user_metadata?.first_name === 'string' && user.user_metadata.first_name) ||
        user.email?.split('@')[0] ||
        'there'
      setUserName(name.split(/\s+/)[0] || 'there')
    })
  }, [])

  void isLoaded
  void AnimatePresence

  return (
    <div className="min-h-screen bg-slate-50 font-sans dark:bg-gray-950">
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {userName || 'there'}
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-500 dark:text-gray-400">
            Your retirement plan is performing{' '}
            <span className="font-bold text-emerald-600">12% better</span> than last quarter.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Content Column */}
          <div className="space-y-10 lg:col-span-8">

            {/* 1. Total Balance Card (Hero) */}
            <Card className="relative overflow-hidden border-slate-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-900">
              <div className="brand-bg absolute left-0 top-0 h-1 w-full" />
              <div className="relative z-10 p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">Total Balance</p>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">$158,420.32</h2>
                      <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                        +4.2%
                      </span>
                    </div>
                  </div>
                  <Badge variant="success" icon={ShieldCheck}>
                    On Track
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Rate of Return</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">+8.4%</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">YTD Earnings</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">+$12,450.00</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Projected at 65</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">$1.24M</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2563EB"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 2. Quick Actions */}
            <section>
              <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  { icon: HandCoins, title: 'Take a Loan', info: 'Borrow up to $10,000', hint: 'Typical approval: 1-3 days', href: '/transactions/loan' },
                  { icon: DollarSign, title: 'Withdraw Money', info: 'Available: $5,000', hint: 'Tax impact: 10-20%', href: '/transactions/withdrawal' },
                  { icon: ArrowLeftRight, title: 'Transfer Funds', info: 'Reallocate balance', hint: 'No fees or penalties', href: '/transactions/transfer' },
                  { icon: RefreshCcw, title: 'Roll Over', info: 'Consolidate savings', hint: 'No tax penalty', href: '/transactions/rollover' },
                ] as const).map((action, i) => (
                  <motion.a
                    key={i}
                    href={action.href}
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); window.location.href = action.href }}
                    whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(37,99,235,0.18)' }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="group relative flex items-start gap-3.5 overflow-hidden rounded-[14px] border border-slate-100 bg-white p-4 pr-5 transition-colors hover:border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-all"
                      style={{ background: 'var(--c-blue-tint, #eff6ff)', color: 'var(--brand-primary)' }}
                    >
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold leading-5 tracking-[-0.3px] text-slate-900 dark:text-white">
                          {action.title}
                        </h4>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 dark:text-gray-600" />
                      </div>
                      <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                        {action.info}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-gray-500">
                        {action.hint}
                      </p>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                      style={{ height: 2, background: 'var(--brand-primary)', borderRadius: 1 }}
                    />
                  </motion.a>
                ))}
              </div>
            </section>

            {/* 4. Monthly Contributions */}
            <Card title="Monthly Contributions">
              <div className="space-y-8">
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Your Contribution</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-gray-400">6% of gross income</p>
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-white">$1,250.00</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100 dark:border-gray-600 dark:bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '60%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="brand-progress h-full rounded-full shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Employer Match</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-gray-400">4% matched at 100%</p>
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-white">$625.00</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100 dark:border-gray-600 dark:bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '40%' }}
                      transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                      className="h-full rounded-full shadow-sm"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 dark:border-gray-700 sm:flex-row">
                  <div className="flex items-center gap-2.5 rounded-full border border-amber-100 bg-amber-50 px-4 py-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">Next contribution on Nov 1, 2023</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Total Monthly</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">$1,875.00</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 5. Portfolio Allocation */}
            <Card title="Portfolio Allocation">
              <div className="flex flex-col items-center gap-10 md:flex-row">
                <div className="w-full md:w-1/2">
                  <div className="flex h-6 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner dark:border-gray-600 dark:bg-gray-700">
                    {portfolioData.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.1 * i }}
                        style={{ backgroundColor: item.color }}
                        className="group relative h-full cursor-help"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
                    {portfolioData.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-sm shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">{item.name}</span>
                        <span className="ml-auto text-sm font-black text-slate-900 dark:text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-gray-700 dark:bg-gray-800 md:w-1/2">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <TrendingUp className="brand-text h-4 w-4" />
                    Allocation Insight
                  </h4>
                  <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-gray-400">
                    Your portfolio is currently{' '}
                    <span className="font-bold text-slate-900 dark:text-white">Aggressive Growth</span>. This aligns with your
                    goal of retiring in 25 years.
                  </p>
                </div>
              </div>
            </Card>

            {/* 7. Recent Activity (Timeline Style) */}
            <Card title="Recent Activity">
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-gray-700">
                {activityData.map((item) => (
                  <div key={item.id} className="group relative flex items-center gap-6">
                    <div className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 bg-white text-slate-500 shadow-sm transition-all group-hover:border-blue-600 group-hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-12 flex-1 rounded-xl border border-transparent p-4 transition-colors hover:border-slate-100 hover:bg-slate-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.type}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-gray-400">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.amount}</p>
                          <Badge variant="success">{item.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 6. Learning Hub */}
            <Card className="group overflow-hidden border-none bg-slate-900 p-0 text-white">
              <div className="relative h-64 sm:h-80">
                <img
                  src="https://picsum.photos/seed/finance/1200/600"
                  alt="Learning Hub"
                  className="h-full w-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-10">
                  <div className="mb-3 flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-blue-400">
                    <BookOpen className="h-4 w-4" />
                    Expert Insights
                  </div>
                  <h3 className="mb-3 text-3xl font-black tracking-tight">Market Volatility: How to Stay the Course</h3>
                  <p className="mb-8 max-w-xl text-base font-medium leading-relaxed text-slate-300">
                    Understand why long-term planning beats short-term reactions in today's changing economy.
                  </p>
                  <button
                    type="button"
                    className="flex w-fit items-center gap-1.5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition-all hover:bg-[var(--brand-primary)] hover:text-white active:scale-95"
                  >
                    Read Article <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4">
            <div className="space-y-10 lg:sticky lg:top-24">

              {/* 3. Readiness Score */}
              <Card className="relative overflow-hidden text-center">
                <div className="absolute right-0 top-0 p-4">
                  <HelpCircle className="h-5 w-5 cursor-help text-slate-300 transition-colors hover:text-blue-600" />
                </div>
                <h3 className="mb-8 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                  Retirement Readiness
                </h3>
                <div className="group relative mx-auto mb-8 h-52 w-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="85%"
                      outerRadius="100%"
                      barSize={14}
                      data={[{ value: 82 }]}
                      startAngle={90}
                      endAngle={450}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: '#F1F5F9' }}
                        dataKey="value"
                        cornerRadius={30}
                        fill="#2563EB"
                        animationDuration={1500}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">82</span>
                    <span className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">Score</span>
                  </div>
                </div>
                <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-bold leading-relaxed text-emerald-900">
                    Great work! You're in the{' '}
                    <span className="underline decoration-2 underline-offset-4 text-emerald-700">top 15%</span> of savers in
                    your age group.
                  </p>
                </div>
                <button className="btn-primary w-full py-4 shadow-lg shadow-blue-600/20">Run Simulation</button>
              </Card>

              {/* 8. Next Best Actions */}
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    Next Best Actions
                  </h3>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-black text-rose-700">
                    2
                  </span>
                </div>
                <div className="space-y-4">
                  {nextActions.map((action) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ x: 4 }}
                      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900 ${
                        action.type === 'warning'
                          ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800/40 dark:bg-amber-950/10'
                          : 'border-blue-200 bg-blue-50/30 dark:border-blue-800/40 dark:bg-blue-950/10'
                      }`}
                    >
                      <div className="mb-2 flex items-start gap-3">
                        {action.type === 'warning' ? (
                          <Zap className="mt-0.5 h-4 w-4 text-amber-600" />
                        ) : (
                          <Calendar className="brand-text mt-0.5 h-4 w-4" />
                        )}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{action.title}</h4>
                      </div>
                      <p className="mb-4 text-xs font-medium leading-relaxed text-slate-500 dark:text-gray-400">
                        {action.description}
                      </p>
                      <button className="group flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        {action.cta}
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* 10. Active Loan */}
              <Card title="Active Loan">
                <div className="space-y-5">
                  <div>
                    <div className="mb-2.5 flex justify-between text-sm">
                      <span className="font-bold text-slate-500 dark:text-gray-400">Remaining Balance</span>
                      <span className="font-black text-slate-900 dark:text-white">$4,250.00</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100 dark:border-gray-600 dark:bg-gray-700">
                      <div className="h-full w-[65%] rounded-full bg-rose-500 shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        Next Payment
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Nov 15, 2023</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-rose-600">$245.00</p>
                    </div>
                  </div>
                  <button className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                    View Repayment Schedule
                  </button>
                </div>
              </Card>

              {/* 9. Advisor Card */}
              <Card className="overflow-hidden border-slate-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-900">
                <div className="brand-bg h-2" />
                <div className="p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src="https://picsum.photos/seed/advisor/100/100"
                        alt="Advisor"
                        className="h-16 w-16 rounded-2xl border-2 border-white object-cover shadow-md dark:border-gray-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-gray-900" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Sarah Jenkins</h4>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        Certified Planner
                      </p>
                    </div>
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        Rating
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">4.9/5.0</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        Experience
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">12 Years</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="btn-primary flex-1 py-3 text-xs shadow-md shadow-blue-600/10">Schedule</button>
                    <button className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-900 transition-all hover:bg-slate-200 active:scale-95 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                      Message
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
