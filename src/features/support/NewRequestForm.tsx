import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { businessDaysFor, CATEGORIES, type ContactPreference, type ServiceCategory, type ServiceRequest } from './serviceCatalog'
import { useServiceStore } from './serviceStore'

const CONTACTS: ContactPreference[] = ['email', 'phone', 'portal']
const SUBJECT = { min: 5, max: 100 }
const DETAILS = { min: 10, max: 2000 }

type Errors = Partial<Record<'category' | 'subject' | 'details', string>>

export function NewRequestForm({
  initialCategory,
  onCreated,
  onCancel,
}: {
  initialCategory?: ServiceCategory
  onCreated: (req: ServiceRequest) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const create = useServiceStore((s) => s.create)
  const uid = useId()

  const [category, setCategory] = useState<ServiceCategory | ''>(initialCategory ?? '')
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [contact, setContact] = useState<ContactPreference>('email')
  const [errors, setErrors] = useState<Errors>({})

  const validate = (): Errors => {
    const e: Errors = {}
    if (!category) e.category = t('support.form.err_category')
    if (subject.trim().length < SUBJECT.min) e.subject = t('support.form.err_subject', { min: SUBJECT.min })
    if (details.trim().length < DETAILS.min) e.details = t('support.form.err_details', { min: DETAILS.min })
    return e
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus()
      return
    }
    onCreated(create({ category: category as ServiceCategory, subject, details, contact }))
  }

  const field =
    'w-full rounded-md border bg-surface-card px-3 text-[13px] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus'
  const err = (k: keyof Errors) => (errors[k] ? 'border-status-danger' : 'border-border-default')

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-[12px] border border-border-default bg-surface-card p-5 shadow-card" aria-label={t('support.form.title')}>
      <h2 className="text-[16px] font-bold text-text-primary">{t('support.form.title')}</h2>

      <div>
        <label htmlFor={`${uid}-category`} className="mb-1 block text-[12px] font-medium text-text-secondary">{t('support.form.category')}</label>
        <select
          id={`${uid}-category`}
          value={category}
          onChange={(e) => setCategory(e.target.value as ServiceCategory | '')}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? `${uid}-category-err` : undefined}
          className={cn(field, 'h-10', err('category'))}
        >
          <option value="">{t('support.form.category_placeholder')}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {t(`support.category.${c.id}`)}
            </option>
          ))}
        </select>
        {errors.category && <p id={`${uid}-category-err`} className="mt-1 text-[12px] text-status-danger">{errors.category}</p>}
        {category && <p className="mt-1 text-[12px] text-text-muted">{t('support.form.sla', { days: businessDaysFor(category) })}</p>}
      </div>

      <div>
        <label htmlFor={`${uid}-subject`} className="mb-1 block text-[12px] font-medium text-text-secondary">{t('support.form.subject')}</label>
        <input
          id={`${uid}-subject`}
          type="text"
          value={subject}
          maxLength={SUBJECT.max}
          onChange={(e) => setSubject(e.target.value)}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? `${uid}-subject-err` : undefined}
          className={cn(field, 'h-10', err('subject'))}
        />
        {errors.subject && <p id={`${uid}-subject-err`} className="mt-1 text-[12px] text-status-danger">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor={`${uid}-details`} className="mb-1 block text-[12px] font-medium text-text-secondary">{t('support.form.details')}</label>
        <textarea
          id={`${uid}-details`}
          rows={5}
          value={details}
          maxLength={DETAILS.max}
          onChange={(e) => setDetails(e.target.value)}
          aria-invalid={!!errors.details}
          aria-describedby={errors.details ? `${uid}-details-err` : undefined}
          className={cn(field, 'resize-y py-2', err('details'))}
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          {errors.details ? <p id={`${uid}-details-err`} className="text-[12px] text-status-danger">{errors.details}</p> : <span />}
          <span className="shrink-0 text-[11px] tabular-nums text-text-muted">{details.length}/{DETAILS.max}</span>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[12px] font-medium text-text-secondary">{t('support.form.contact')}</legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup">
          {CONTACTS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={contact === c}
              onClick={() => setContact(c)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors',
                contact === c ? 'border-primary bg-primary text-text-inverse' : 'border-border-default bg-surface-card text-text-secondary hover:bg-surface-elevated',
              )}
            >
              {t(`support.contact.${c}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="flex items-start gap-2 rounded-lg bg-status-warning-bg px-3 py-2 text-[12px] leading-snug text-text-secondary">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" aria-hidden />
        {t('support.form.privacy')}
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border-default px-4 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-elevated">
          {t('support.form.cancel')}
        </button>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-text-inverse transition-colors hover:bg-primary-hover">
          {t('support.form.submit')}
        </button>
      </div>
    </form>
  )
}
