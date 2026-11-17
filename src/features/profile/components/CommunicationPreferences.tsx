import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/design-system/components/Button'
import { cn } from '@/lib/cn'
import { REQUIRED_TOPICS, TOPICS, useCommunicationStore, type CommunicationPreferences as Preferences, type Delivery, type Topic } from '../communicationStore'
import { useProfileStore } from '../profileStore'

const DELIVERIES: Delivery[] = ['paperless', 'mail']

/**
 * How the plan reaches the participant: paperless or mailed delivery for required notices, then email and
 * text choices for each kind of message. Nothing changes until Save.
 */
export function CommunicationPreferences() {
  const { t } = useTranslation()
  const stored = useCommunicationStore((s) => s.preferences)
  const save = useCommunicationStore((s) => s.save)
  const email = useProfileStore((s) => s.personal.email)
  const phone = useProfileStore((s) => `${s.personal.phoneCode} ${s.personal.phone}`)

  const [draft, setDraft] = useState<Preferences>(stored)
  const [justSaved, setJustSaved] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored)
  const usesText = TOPICS.some((topic) => draft.text[topic])

  const change = (next: Preferences) => {
    setDraft(next)
    setJustSaved(false)
  }
  const toggle = (channel: 'email' | 'text', topic: Topic, on: boolean) => change({ ...draft, [channel]: { ...draft[channel], [topic]: on } })

  const submit = () => {
    // Agreeing to texts is recorded the first time a topic uses them, and cleared when none do
    const textConsentAt = usesText ? (stored.textConsentAt ?? new Date().toISOString()) : null
    const next = { ...draft, textConsentAt }
    save(next)
    setDraft(next)
    setJustSaved(true)
  }

  const box = 'h-4 w-4 rounded border-border-default accent-primary focus:ring-2 focus:ring-border-focus disabled:opacity-60'

  return (
    <div>
      <p className="mb-1 text-[18px] font-bold leading-tight text-text-primary">{t('comms.title')}</p>
      <p className="mb-4 text-xs text-text-secondary">
        {t('comms.sent_to', { email, phone })}{' '}
        <Link to="/profile?section=personal" className="font-semibold text-primary hover:underline dark:text-blue-300">{t('comms.change_contact')}</Link>
      </p>

      {/* Paperless or mail, for the documents the plan must deliver */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t('comms.delivery')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {DELIVERIES.map((d) => (
            <label
              key={d}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 transition-shadow has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-300/70',
                draft.delivery === d ? 'bg-blue-50 ring-2 ring-primary dark:bg-blue-500/10 dark:ring-blue-400' : 'bg-white ring-1 ring-slate-200 hover:ring-blue-300 dark:bg-white/5 dark:ring-white/10',
              )}
            >
              <input type="radio" name="comms-delivery" value={d} checked={draft.delivery === d} onChange={() => change({ ...draft, delivery: d })} className="sr-only" />
              <span>
                <span className="block text-sm font-bold text-text-primary">{t(`comms.delivery_${d}`)}</span>
                <span className="mt-0.5 block text-xs text-text-secondary">{t(`comms.delivery_${d}_sub`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* One row per kind of message, a column per channel */}
      <table className="mt-5 w-full text-left">
        <caption className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">{t('comms.topics')}</caption>
        <thead>
          <tr className="border-b border-slate-200/80 text-xs text-text-secondary dark:border-white/10">
            <th scope="col" className="py-2 font-medium"><span className="sr-only">{t('comms.topic')}</span></th>
            <th scope="col" className="w-16 py-2 text-center font-medium">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" aria-hidden />{t('comms.email')}</span>
            </th>
            <th scope="col" className="w-16 py-2 text-center font-medium">
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{t('comms.text')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
          {TOPICS.map((topic) => {
            const required = REQUIRED_TOPICS.includes(topic)
            const name = t(`comms.topic_${topic}`)
            return (
              <tr key={topic}>
                <th scope="row" className="py-3 pr-3 font-normal">
                  <span className="block text-sm font-medium text-text-primary">
                    {name}
                    {required && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">{t('comms.required')}</span>}
                  </span>
                  <span className="block text-xs text-text-muted">{t(`comms.topic_${topic}_sub`)}</span>
                </th>
                <td className="py-3 text-center">
                  {/* Required documents follow the delivery choice above: on when paperless, mailed otherwise */}
                  <input
                    type="checkbox"
                    aria-label={`${name}: ${t('comms.email')}`}
                    className={box}
                    disabled={required}
                    checked={required ? draft.delivery === 'paperless' : draft.email[topic]}
                    onChange={(e) => toggle('email', topic, e.target.checked)}
                  />
                </td>
                <td className="py-3 text-center">
                  <input type="checkbox" aria-label={`${name}: ${t('comms.text')}`} className={box} checked={draft.text[topic]} onChange={(e) => toggle('text', topic, e.target.checked)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-text-muted">{usesText ? t('comms.text_consent') : t('comms.portal_note')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button className="w-fit" onClick={submit} disabled={!dirty}>{t('comms.save')}</Button>
        {justSaved && (
          <span role="status" className="flex items-center gap-1 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {t('profile.d.saved')}
          </span>
        )}
      </div>
    </div>
  )
}

export default CommunicationPreferences
