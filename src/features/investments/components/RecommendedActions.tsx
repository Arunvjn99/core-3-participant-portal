import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, TrendingUp, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react'

const ACTION_IDS = ['rebalance', 'contrib', 'risk'] as const

function RecommendedActions() {
  const { t } = useTranslation()

  const actions = useMemo(
    () =>
      ACTION_IDS.map((id) => {
        const base = `investments.reco_${id}` as const
        const icons = { rebalance: RefreshCw, contrib: TrendingUp, risk: ShieldAlert } as const
        const iconBg = {
          rebalance: 'bg-blue-50',
          contrib: 'bg-emerald-50',
          risk: 'bg-amber-50',
        }[id]
        const iconColor = {
          rebalance: 'text-blue-600',
          contrib: 'text-emerald-600',
          risk: 'text-amber-600',
        }[id]
        const ctaBg = {
          rebalance: 'btn-brand',
          contrib: 'bg-emerald-600 hover:bg-emerald-700',
          risk: 'bg-amber-600 hover:bg-amber-700',
        }[id]
        const accentColor = {
          rebalance: 'from-blue-500',
          contrib: 'from-emerald-500',
          risk: 'from-amber-500',
        }[id]
        const priorityClass = {
          rebalance: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
          contrib: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
          risk: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
        }[id]
        return {
          id,
          title: t(`${base}_title`),
          description: t(`${base}_desc`),
          improvement: t(`${base}_improve`),
          ctaLabel: t(`${base}_cta`),
          priority: t(`${base}_priority`),
          priorityClass,
          Icon: icons[id],
          iconBg,
          iconColor,
          ctaBg,
          accentColor,
        }
      }),
    [t],
  )

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="text-gray-900 dark:text-white">{t('investments.reco_section_title')}</h3>
      </div>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">{t('investments.reco_section_subtitle')}</p>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.Icon
          return (
            <div
              key={action.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${action.accentColor} to-transparent opacity-60`} />

              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.iconBg}`}>
                  <Icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>
                    {action.title}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${action.priorityClass}`} style={{ fontWeight: 500 }}>
                    {action.priority}
                  </span>
                </div>
              </div>

              <p className="mb-3 flex-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{action.description}</p>

              <p className="mb-4 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{action.improvement}</p>

              <button
                type="button"
                className={`mt-auto flex w-full items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-colors ${action.ctaBg}`}
              >
                {action.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecommendedActions
