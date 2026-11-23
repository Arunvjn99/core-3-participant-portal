import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock, ChevronRight, CircleCheck, CirclePause } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppIcon } from '@/design-system/icons'
import { personaDates, type DemoPersona } from './personas'

const TONE = {
  auto_enrolled: { box: 'bg-emerald-50 ring-emerald-200/80 dark:bg-emerald-500/10 dark:ring-emerald-400/25', icon: 'text-emerald-600 dark:text-emerald-300', Icon: CircleCheck },
  not_eligible: { box: 'bg-blue-50 ring-blue-200/80 dark:bg-blue-500/10 dark:ring-blue-400/25', icon: 'text-[#2563EB] dark:text-blue-300', Icon: CalendarClock },
  opted_out: { box: 'bg-rose-50 ring-rose-200/80 dark:bg-rose-500/10 dark:ring-rose-400/25', icon: 'text-rose-600 dark:text-rose-300', Icon: CirclePause },
} as const

/**
 * Where a demo participant stands with the plan, in one short notice: auto-enrolled, not eligible yet, or opted out.
 * Enrolled and eligible participants need none, so nothing is shown for them.
 */
export function PersonaNotice({ persona, className }: { persona: DemoPersona | null; className?: string }) {
  const { t, i18n } = useTranslation()
  if (!persona || !(persona.status in TONE)) return null
  const status = persona.status as keyof typeof TONE
  const tone = TONE[status]
  const dates = personaDates(persona, i18n.language)
  const copy =
    status === 'auto_enrolled'
      ? { title: t('demo.notice_auto_title'), body: t('demo.notice_auto_body', { rate: persona.rate }) }
      : status === 'not_eligible'
        ? { title: t('demo.notice_ineligible_title', { date: dates.eligible }), body: t('demo.notice_ineligible_body') }
        : { title: t('demo.notice_optout_title'), body: t('demo.notice_optout_body', { date: dates.optedOut }) }

  return (
    <div role="status" className={cn('flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1', tone.box, className)}>
      <AppIcon icon={tone.Icon} size="item" className={cn('mt-px', tone.icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-text-primary">{copy.title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-slate-700 dark:text-slate-200">{copy.body}</p>
        {status === 'auto_enrolled' && (
          <Link to="/enrollment/manage" className="mt-2 inline-flex min-h-8 items-center gap-1 rounded-md text-[13px] font-semibold text-emerald-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300">
            {t('demo.notice_auto_cta')}
            <AppIcon icon={ChevronRight} size="inline" />
          </Link>
        )}
      </div>
    </div>
  )
}
