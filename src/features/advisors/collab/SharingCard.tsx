import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useCollabStore, type SharingConsent } from './collabStore'

const SCOPES: (keyof Pick<SharingConsent, 'balance' | 'contributions' | 'investments'>)[] = ['balance', 'contributions', 'investments']

/** Participant-controlled consent for what the adviser can see. Revocable at any time. */
export function SharingCard() {
  const { t } = useTranslation()
  const sharing = useCollabStore((s) => s.sharing)
  const setSharing = useCollabStore((s) => s.setSharing)
  const when = sharing.updatedAt
    ? new Date(sharing.updatedAt).toLocaleDateString(getAppDateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="rounded-[12px] border border-border-default bg-surface-card p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-[14px] font-bold text-text-primary">{t('adviser.sharing.title')}</h2>
      </div>
      <p className="text-[12px] leading-relaxed text-text-secondary">{t('adviser.sharing.body')}</p>

      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg bg-surface-elevated p-3">
        <input
          type="checkbox"
          role="switch"
          checked={sharing.enabled}
          onChange={(e) => setSharing({ enabled: e.target.checked })}
          className="mt-0.5 h-5 w-5 rounded border-border-default accent-blue-600"
        />
        <span className="text-[13px] font-medium text-text-primary">{t('adviser.sharing.toggle')}</span>
      </label>

      {sharing.enabled && (
        <fieldset className="mt-3 space-y-2">
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t('adviser.sharing.scope')}</legend>
          {SCOPES.map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-primary">
              <input type="checkbox" checked={sharing[k]} onChange={(e) => setSharing({ [k]: e.target.checked })} className="h-4 w-4 rounded accent-blue-600" />
              {t(`adviser.sharing.scope_${k}`)}
            </label>
          ))}
        </fieldset>
      )}

      <p className="mt-3 text-[11px] text-text-muted" role="status">
        {sharing.enabled
          ? t('adviser.sharing.status_on', { date: when ?? '' })
          : when
            ? t('adviser.sharing.status_off_since', { date: when })
            : t('adviser.sharing.status_off')}
      </p>
    </div>
  )
}
