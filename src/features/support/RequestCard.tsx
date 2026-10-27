import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { TransactionTimeline } from '@/features/transactions/tracking/TransactionTimeline'
import type { ServiceRequest, ServiceStatus } from './serviceCatalog'
import type { TransactionTimeline as Timeline } from '@/features/transactions/tracking/timeline'
import { useServiceStore } from './serviceStore'

const STATUS_STYLE: Record<ServiceStatus, string> = {
  open: 'bg-status-info-bg text-primary',
  in_progress: 'bg-status-warning-bg text-status-warning',
  resolved: 'bg-status-success-bg text-status-success',
  cancelled: 'bg-surface-elevated text-text-muted',
}

export function RequestCard({ req, timeline, status, defaultOpen }: { req: ServiceRequest; timeline: Timeline; status: ServiceStatus; defaultOpen: boolean }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const addNote = useServiceStore((s) => s.addNote)
  const cancel = useServiceStore((s) => s.cancel)
  const [open, setOpen] = useState(defaultOpen)
  const [note, setNote] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const fmt = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  const fmtTime = (ms: number) => new Date(ms).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const active = status === 'open' || status === 'in_progress'

  return (
    <div className="rounded-lg border border-border-default bg-surface-card">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-semibold text-text-primary">{req.subject}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[status])}>{t(`support.status.${status}`)}</span>
          </span>
          <span className="mt-0.5 block text-[12px] text-text-secondary">
            {req.ref} · {t(`support.category.${req.category}`)} · {t('support.submitted_on', { date: fmt(req.submittedAt) })}
            {active && <> · {t('support.expected_by', { date: fmt(timeline.expectedAt) })}</>}
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border-default p-4">
          {status !== 'cancelled' && <TransactionTimeline timeline={timeline} ns="support" />}
          {status === 'cancelled' && req.cancelledAt && (
            <p className="text-[13px] text-text-secondary">{t('support.cancelled_on', { date: fmt(req.cancelledAt) })}</p>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t('support.details')}</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">{req.details}</p>
            <p className="mt-1 text-[12px] text-text-muted">{t('support.contact_via', { how: t(`support.contact.${req.contact}`) })}</p>
          </div>

          {req.notes.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t('support.notes')}</p>
              <ul className="mt-1.5 space-y-2">
                {req.notes.map((n) => (
                  <li key={n.at} className="rounded-lg bg-surface-elevated px-3 py-2">
                    <p className="whitespace-pre-wrap text-[13px] text-text-primary">{n.text}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{fmtTime(n.at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {active && (
            <>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault()
                  addNote(req.id, note)
                  setNote('')
                }}
              >
                <label htmlFor={`note-${req.id}`} className="sr-only">{t('support.add_note')}</label>
                <input
                  id={`note-${req.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('support.add_note')}
                  className="h-9 flex-1 rounded-md border border-border-default bg-surface-card px-3 text-[13px] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                />
                <button type="submit" disabled={!note.trim()} className="rounded-md border border-border-default px-3 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-elevated disabled:pointer-events-none disabled:opacity-50">
                  {t('support.add_note_btn')}
                </button>
              </form>

              {confirmCancel ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-status-danger-bg px-3 py-2.5" role="alert">
                  <p className="flex-1 text-[13px] text-text-primary">{t('support.cancel_confirm')}</p>
                  <button type="button" onClick={() => cancel(req.id)} className="rounded-md bg-status-danger px-3 py-1.5 text-[13px] font-medium text-text-inverse hover:opacity-90">
                    {t('support.cancel_yes')}
                  </button>
                  <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-text-primary hover:bg-surface-elevated">
                    {t('support.cancel_no')}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmCancel(true)} className="text-[12px] font-medium text-text-secondary underline-offset-2 hover:text-status-danger hover:underline">
                  {t('support.cancel_request')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
