import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useCollabStore } from './collabStore'
import { RECOMMENDATIONS } from './adviser'

export function RecommendationsPanel() {
  const { t } = useTranslation()
  const done = useCollabStore((s) => s.doneRecs)
  const toggle = useCollabStore((s) => s.toggleRec)

  return (
    <ul className="space-y-3">
      {RECOMMENDATIONS.map((r) => {
        const isDone = done.includes(r.id)
        return (
          <li key={r.id} className={cn('flex gap-3 rounded-lg border border-border-default bg-surface-card p-4', isDone && 'opacity-70')}>
            <button
              type="button"
              onClick={() => toggle(r.id)}
              aria-pressed={isDone}
              aria-label={`${t(isDone ? 'adviser.recs.mark_open' : 'adviser.recs.mark_done')}: ${t(`adviser.recs.${r.id}_title`)}`}
              className="mt-0.5 shrink-0 text-text-muted transition-colors hover:text-primary"
            >
              {isDone ? <CheckCircle2 className="h-5 w-5 text-status-success" /> : <Circle className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn('text-[14px] font-semibold text-text-primary', isDone && 'line-through')}>{t(`adviser.recs.${r.id}_title`)}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">{t(`adviser.recs.${r.id}_body`)}</p>
              {!isDone && (
                <Link to={r.href} className="mt-1.5 inline-block text-[12px] font-semibold text-primary hover:underline">
                  {t(`adviser.recs.${r.id}_cta`)}
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
