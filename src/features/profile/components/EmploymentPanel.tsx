import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/design-system/components/Badge'
import { Input } from '@/design-system/components/Input'
import { getAppDateLocale } from '@/lib/dateLocale'
import { isPastDate, type EmploymentDetails, type StatusFlags } from '../profileData'
import { useProfileStore } from '../profileStore'
import { FormActions, ProfileCard, ReadField, ReadGrid } from './ProfileCard'

const FLAG_KEYS: (keyof StatusFlags)[] = ['qdro', 'familyMemberOfOwner', 'officer', 'hce', 'keyEmployee', 'insiderRestricted']

type EditableKeys = 'hireDate' | 'ownershipPct' | 'rehireDate' | 'termDate'

export function EmploymentPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const employment = useProfileStore((s) => s.employment)
  const flags = useProfileStore((s) => s.flags)
  const save = useProfileStore((s) => s.saveEmployment)

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<Pick<EmploymentDetails, EditableKeys>>(employment)
  const [pct, setPct] = useState(String(employment.ownershipPct))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fmt = (iso: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '')
  const yesNo = (v: boolean) => (v ? t('profile.d.yes') : t('profile.d.no'))

  const startEdit = () => {
    setDraft({ hireDate: employment.hireDate, ownershipPct: employment.ownershipPct, rehireDate: employment.rehireDate, termDate: employment.termDate })
    setPct(String(employment.ownershipPct))
    setErrors({})
    setSaved(false)
    setEditing(true)
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    const now = Date.now()
    if (!draft.hireDate || !isPastDate(draft.hireDate, now)) e.hireDate = t('profile.d.err_date')
    if (draft.rehireDate && !isPastDate(draft.rehireDate, now)) e.rehireDate = t('profile.d.err_date')
    if (draft.termDate && !isPastDate(draft.termDate, now)) e.termDate = t('profile.d.err_date')
    const p = Number(pct)
    if (pct.trim() === '' || Number.isNaN(p) || p < 0 || p > 100) e.ownershipPct = t('profile.d.err_pct')
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    save({ ...draft, ownershipPct: p })
    setEditing(false)
    setSaved(true)
  }

  const inv = (k: string) => ({ error: errors[k], 'aria-invalid': errors[k] ? (true as const) : undefined })

  return (
    <div className="space-y-5">
      {!editing ? (
        <ProfileCard title={t('profile.d.employment_title')} onEdit={startEdit} saved={saved}>
          <ReadGrid>
            <ReadField label={t('profile.d.employer')}>{employment.employer}</ReadField>
            <ReadField label={t('profile.d.job')}>{employment.jobTitle}</ReadField>
            <ReadField label={t('profile.d.payroll_frequency')}>{t(`profile.d.payroll_${employment.payrollFrequency}`)}</ReadField>
            <ReadField label={t('profile.d.hire_date')}>{fmt(employment.hireDate)}</ReadField>
            <ReadField label={t('profile.d.ownership')}>{employment.ownershipPct}%</ReadField>
            <ReadField label={t('profile.d.rehire')}>{yesNo(!!employment.rehireDate)}</ReadField>
            <ReadField label={t('profile.d.rehire_date')}>{fmt(employment.rehireDate)}</ReadField>
            <ReadField label={t('profile.d.term_date')}>{fmt(employment.termDate)}</ReadField>
          </ReadGrid>
        </ProfileCard>
      ) : (
        <ProfileCard title={t('profile.d.employment_title')} editing>
          <form onSubmit={submit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="em-hire" type="date" label={`${t('profile.d.hire_date')} *`} value={draft.hireDate} onChange={(e) => setDraft({ ...draft, hireDate: e.target.value })} {...inv('hireDate')} />
              <Input id="em-own" inputMode="decimal" label={`${t('profile.d.ownership')} (%) *`} value={pct} onChange={(e) => setPct(e.target.value)} {...inv('ownershipPct')} />
              <Input id="em-rehire" type="date" label={t('profile.d.rehire_date')} value={draft.rehireDate} onChange={(e) => setDraft({ ...draft, rehireDate: e.target.value })} {...inv('rehireDate')} />
              <Input id="em-term" type="date" label={t('profile.d.term_date')} value={draft.termDate} onChange={(e) => setDraft({ ...draft, termDate: e.target.value })} {...inv('termDate')} />
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('profile.d.employment_note')}</p>
            <FormActions onCancel={() => setEditing(false)} saveLabel={t('profile.d.save')} cancelLabel={t('profile.d.cancel')} />
          </form>
        </ProfileCard>
      )}

      <ProfileCard title={t('profile.d.flags_title')} subtitle={t('profile.d.flags_sub')}>
        <ReadGrid cols={3}>
          {FLAG_KEYS.map((k) => (
            <ReadField key={k} label={t(`profile.d.flag_${k}`)}>
              <Badge variant={flags[k] ? 'warning' : 'default'}>{yesNo(flags[k])}</Badge>
            </ReadField>
          ))}
        </ReadGrid>
      </ProfileCard>
    </div>
  )
}
