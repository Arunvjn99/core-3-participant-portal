import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Target, TrendingUp } from 'lucide-react'

const goalValue = 1300

const scenarios: Record<
  string,
  {
    data: { age: number; projected: number }[]
    projected: string
    monthlyIncome: string
    color: string
    score: number
  }
> = {
  Base: {
    projected: '$1,420,000',
    monthlyIncome: '$4,820',
    color: '#3b82f6',
    score: 74,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 420 },
      { age: 45, projected: 580 },
      { age: 50, projected: 780 },
      { age: 55, projected: 1020 },
      { age: 60, projected: 1220 },
      { age: 65, projected: 1420 },
    ],
  },
  'Market -10%': {
    projected: '$1,120,000',
    monthlyIncome: '$3,800',
    color: '#ef4444',
    score: 58,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 370 },
      { age: 45, projected: 470 },
      { age: 50, projected: 610 },
      { age: 55, projected: 790 },
      { age: 60, projected: 950 },
      { age: 65, projected: 1120 },
    ],
  },
  'Market +10%': {
    projected: '$1,780,000',
    monthlyIncome: '$6,040',
    color: '#10b981',
    score: 92,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 480 },
      { age: 45, projected: 710 },
      { age: 50, projected: 990 },
      { age: 55, projected: 1300 },
      { age: 60, projected: 1540 },
      { age: 65, projected: 1780 },
    ],
  },
  '+2% Contribution': {
    projected: '$1,610,000',
    monthlyIncome: '$5,460',
    color: 'var(--brand-purple-light)',
    score: 84,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 460 },
      { age: 45, projected: 660 },
      { age: 50, projected: 900 },
      { age: 55, projected: 1180 },
      { age: 60, projected: 1400 },
      { age: 65, projected: 1610 },
    ],
  },
}

const tabs = Object.keys(scenarios)

function scenarioTabLabel(tab: string, t: (k: string) => string) {
  if (tab === 'Base') return t('investments.retirement_scenario_base')
  if (tab === 'Market -10%') return t('investments.retirement_scenario_down')
  if (tab === 'Market +10%') return t('investments.retirement_scenario_up')
  if (tab === '+2% Contribution') return t('investments.retirement_scenario_contrib')
  return tab
}

function scenarioDescriptionKey(tab: string) {
  if (tab === 'Base') return 'investments.retirement_desc_base'
  if (tab === 'Market -10%') return 'investments.retirement_desc_down'
  if (tab === 'Market +10%') return 'investments.retirement_desc_up'
  if (tab === '+2% Contribution') return 'investments.retirement_desc_contrib'
  return 'investments.retirement_desc_base'
}

function ReadinessRing({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
          {score}
        </span>
        <span className="text-[10px] text-gray-400">/ 100</span>
      </div>
    </div>
  )
}

function RetirementPlanning() {
  const { t } = useTranslation()
  const [active, setActive] = useState('Base')
  const scenario = scenarios[active]
  const meetsGoal = parseInt(scenario.projected.replace(/\D/g, ''), 10) >= goalValue * 1000

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { text: t('investments.retirement_score_on_track'), bg: 'bg-emerald-50', color: 'text-emerald-700' }
    if (s >= 60) return { text: t('investments.retirement_score_attention'), bg: 'bg-amber-50', color: 'text-amber-700' }
    return { text: t('investments.retirement_score_off'), bg: 'bg-red-50', color: 'text-red-700' }
  }

  const scoreLabel = getScoreLabel(scenario.score)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          <h3 className="text-gray-900 dark:text-white">{t('investments.retirement_title')}</h3>
        </div>
        <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">{t('investments.retirement_subtitle_long')}</p>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl bg-gray-50/80 p-4 dark:bg-gray-800">
            <ReadinessRing score={scenario.score} color={scenario.color} />
            <div>
              <p className="mb-0.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ fontWeight: 500 }}>
                {t('investments.retirement_readiness')}
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${scoreLabel.bg} ${scoreLabel.color}`}
                style={{ fontWeight: 500 }}
              >
                <TrendingUp className="h-3 w-3" />
                {scoreLabel.text}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-gray-800">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ fontWeight: 500 }}>
              {t('investments.retirement_projected')}
            </p>
            <p className="text-2xl tracking-tight text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
              {scenario.projected}
            </p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                meetsGoal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
              style={{ fontWeight: 500 }}
            >
              {meetsGoal ? t('investments.retirement_meets_goal') : t('investments.retirement_below_goal')}
            </span>
          </div>

          <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-gray-800">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ fontWeight: 500 }}>
              {t('investments.retirement_monthly')}
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl tracking-tight text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
                {scenario.monthlyIncome}
              </p>
              <span className="text-xs text-gray-400 dark:text-gray-500">{t('investments.retirement_per_mo')}</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{t('investments.retirement_withdrawal_note')}</p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
                active === tab
                  ? 'bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {scenarioTabLabel(tab, t)}
            </button>
          ))}
        </div>

        <div style={{ width: '100%', height: 220, minHeight: 220, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={scenario.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`retireGrad-${active}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={scenario.color} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={scenario.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}k`}
              />
              <ReferenceLine
                y={goalValue}
                stroke="#d1d5db"
                strokeDasharray="6 4"
                label={{
                  value: t('investments.retirement_chart_goal'),
                  position: 'insideTopRight',
                  fill: '#9ca3af',
                  fontSize: 10,
                }}
              />
              <Area
                key="area-projected"
                type="monotone"
                dataKey="projected"
                stroke={scenario.color}
                strokeWidth={2.5}
                fill={`url(#retireGrad-${active})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center gap-5 border-t border-gray-100 pt-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: scenario.color }} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('investments.retirement_legend_projected')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 border-t border-dashed border-gray-300 dark:border-gray-600" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('investments.retirement_legend_goal')}</span>
          </div>
          <p className="ml-auto hidden text-[11px] text-gray-400 dark:text-gray-500 sm:block">{t(scenarioDescriptionKey(active))}</p>
        </div>
      </div>
    </div>
  )
}

export default RetirementPlanning
