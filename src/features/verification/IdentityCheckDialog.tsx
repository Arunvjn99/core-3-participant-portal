import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { Modal } from '@/design-system/components/Modal'
import { Input } from '@/design-system/components/Input'
import { cn } from '@/lib/cn'
import { BODY_TEXT, HEADING, IconChip, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, choice } from '@/features/enrollment/enrollmentUi'
import { digitsOnly } from '@/features/profile/profileData'
import { useProfileStore } from '@/features/profile/profileStore'
import { checkIdentityAnswers, getIdentityQuestions, type IdentityFacts, type IdentityQuestion } from './verificationService'
import { useVerificationStore } from './verificationStore'

const MAX_ATTEMPTS = 3

type Step = 'confirm' | 'questions' | 'passed' | 'failed'

/**
 * Identity check before a sensitive change: the participant confirms two details from their record, then
 * answers three knowledge questions. A pass is remembered for a short while, so one check covers a few changes.
 */
export function IdentityCheckDialog({ open, onClose, onVerified }: { open: boolean; onClose: () => void; onVerified: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={t('verify.identity.title')} size="md">
      {/* Mounted only while open, so every check starts from the first step */}
      <IdentityCheckBody onClose={onClose} onVerified={onVerified} />
    </Modal>
  )
}

function IdentityCheckBody({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const { t } = useTranslation()
  const personal = useProfileStore((s) => s.personal)
  const hireDate = useProfileStore((s) => s.employment.hireDate)
  const ssn = useProfileStore((s) => s.sensitive.ssn)
  const attempts = useVerificationStore((s) => s.identityAttempts)
  const passIdentity = useVerificationStore((s) => s.passIdentity)
  const failIdentity = useVerificationStore((s) => s.failIdentity)

  const [step, setStep] = useState<Step>('confirm')
  const [last4, setLast4] = useState('')
  const [dob, setDob] = useState('')
  const [confirmError, setConfirmError] = useState(false)
  const [questions, setQuestions] = useState<IdentityQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Partial<Record<IdentityQuestion['id'], string>>>({})

  const locked = attempts >= MAX_ATTEMPTS
  const facts: IdentityFacts = { street: personal.address1, city: personal.city, hireYear: Number(hireDate.slice(0, 4)) }

  const fail = () => {
    failIdentity()
    setStep('failed')
  }

  const submitConfirm = async (ev: FormEvent) => {
    ev.preventDefault()
    if (last4 !== digitsOnly(ssn).slice(-4) || dob !== personal.dob) {
      setConfirmError(true)
      return fail()
    }
    setQuestions(await getIdentityQuestions(facts))
    setStep('questions')
  }

  const question = questions[index]
  const picked = question ? answers[question.id] : undefined

  const next = async () => {
    if (index < questions.length - 1) return setIndex(index + 1)
    const { passed } = await checkIdentityAnswers(facts, answers as Record<IdentityQuestion['id'], string>)
    if (!passed) return fail()
    passIdentity()
    setStep('passed')
  }

  return (
    <>
      {step === 'confirm' && !locked && (
        <form onSubmit={(e) => void submitConfirm(e)} noValidate>
          <p className={cn('text-sm', BODY_TEXT)}>{t('verify.identity.intro')}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              id="idv-last4"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              label={t('verify.identity.last4')}
              value={last4}
              onChange={(e) => setLast4(digitsOnly(e.target.value).slice(0, 4))}
              error={confirmError ? t('verify.identity.err_match') : undefined}
              aria-invalid={confirmError || undefined}
            />
            <Input id="idv-dob" type="date" autoComplete="bday" label={t('verify.identity.dob')} value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('verify.cancel')}</button>
            <button type="submit" disabled={last4.length !== 4 || !dob} className={PILL_PRIMARY}>{t('verify.continue')}</button>
          </div>
        </form>
      )}

      {step === 'questions' && question && (
        <div>
          <p className={cn('text-xs font-semibold', MUTED_TEXT)}>{t('verify.identity.progress', { n: index + 1, total: questions.length })}</p>
          <p id="idv-question" className={cn('mt-1 text-base font-bold', HEADING)}>{t(`verify.identity.q_${question.id}`)}</p>
          <div role="radiogroup" aria-labelledby="idv-question" className="mt-4 grid gap-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={picked === option}
                onClick={() => setAnswers((a) => ({ ...a, [question.id]: option }))}
                className={cn(choice(picked === option), 'px-4 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70', HEADING)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('verify.cancel')}</button>
            <button type="button" disabled={!picked} onClick={() => void next()} className={PILL_PRIMARY}>
              {index < questions.length - 1 ? t('verify.continue') : t('verify.identity.finish')}
            </button>
          </div>
        </div>
      )}

      {step === 'passed' && (
        <div className="text-center">
          <span className="mx-auto flex w-fit"><IconChip Icon={ShieldCheck} tone="emerald" /></span>
          <p className={cn('mt-3 text-base font-bold', HEADING)}>{t('verify.identity.passed_title')}</p>
          <p className={cn('mt-1 text-sm', BODY_TEXT)}>{t('verify.identity.passed_body')}</p>
          <button type="button" onClick={onVerified} className={cn(PILL_PRIMARY, 'mt-5')}>{t('verify.continue')}</button>
        </div>
      )}

      {(step === 'failed' || (locked && step === 'confirm')) && (
        <div className="text-center" role="alert">
          <span className="mx-auto flex w-fit"><IconChip Icon={ShieldAlert} tone="amber" /></span>
          <p className={cn('mt-3 text-base font-bold', HEADING)}>{t(locked ? 'verify.identity.locked_title' : 'verify.identity.failed_title')}</p>
          <p className={cn('mt-1 text-sm', BODY_TEXT)}>
            {locked ? t('verify.identity.locked_body') : t('verify.identity.failed_body', { count: MAX_ATTEMPTS - attempts })}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('verify.close')}</button>
            {!locked && (
              <button
                type="button"
                onClick={() => {
                  setLast4('')
                  setDob('')
                  setConfirmError(false)
                  setIndex(0)
                  setAnswers({})
                  setStep('confirm')
                }}
                className={PILL_PRIMARY}
              >
                {t('verify.identity.try_again')}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default IdentityCheckDialog
