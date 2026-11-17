import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Coins, Zap } from 'lucide-react'
import { Modal } from '@/design-system/components/Modal'
import { Input } from '@/design-system/components/Input'
import { cn } from '@/lib/cn'
import { BODY_TEXT, HEADING, IconChip, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, choice } from '@/features/enrollment/enrollmentUi'
import { getAppDateLocale } from '@/lib/dateLocale'
import { confirmMicroDeposits, sendMicroDeposits, verifyBankInstant, type BankCheckFailure } from './verificationService'
import { useVerificationStore } from './verificationStore'

type Step = 'choose' | 'instant_failed' | 'deposits' | 'done'

/**
 * Confirms a bank account belongs to the participant before money is sent to it: an instant check, or two
 * small deposits whose amounts the participant types back.
 */
export function BankVerifyDialog({ open, onClose, ...account }: { open: boolean; onClose: () => void; accountHolder: string; routing: string; participantLastName: string }) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={t('verify.bank.title')} size="md">
      {/* Mounted only while open, so it starts on the right step for the account's current status */}
      <BankVerifyBody onClose={onClose} {...account} />
    </Modal>
  )
}

function BankVerifyBody({ onClose, accountHolder, routing, participantLastName }: { onClose: () => void; accountHolder: string; routing: string; participantLastName: string }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const bank = useVerificationStore((s) => s.bank)
  const setBank = useVerificationStore((s) => s.setBank)

  // Deposits already on their way: go straight to entering the amounts
  const [step, setStep] = useState<Step>(() => (bank.status === 'pending_deposits' ? 'deposits' : 'choose'))
  const [failure, setFailure] = useState<BankCheckFailure | null>(null)
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [amountError, setAmountError] = useState(false)

  const instant = async () => {
    const result = await verifyBankInstant({ accountHolder, routing, participantLastName })
    if (result.ok) {
      setBank({ status: 'verified', method: 'instant', verifiedAt: new Date().toISOString() })
      setStep('done')
    } else {
      setFailure(result.reason)
      setStep('instant_failed')
    }
  }

  const startDeposits = async () => {
    const { sentAt } = await sendMicroDeposits()
    setBank({ status: 'pending_deposits', sentAt })
    setStep('deposits')
  }

  const confirmDeposits = async (ev: FormEvent) => {
    ev.preventDefault()
    const { ok } = await confirmMicroDeposits(Number(first), Number(second))
    if (!ok) return setAmountError(true)
    setBank({ status: 'verified', method: 'deposits', verifiedAt: new Date().toISOString() })
    setStep('done')
  }

  const sentOn = bank.status === 'pending_deposits' ? new Date(bank.sentAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : ''
  const methodTile = 'flex w-full items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70'

  return (
    <>
      {step === 'choose' && (
        <div>
          <p className={cn('text-sm', BODY_TEXT)}>{t('verify.bank.intro')}</p>
          <div className="mt-4 grid gap-3">
            <button type="button" onClick={() => void instant()} className={cn(choice(false), methodTile)}>
              <IconChip Icon={Zap} tone="blue" />
              <span>
                <span className={cn('block text-sm font-bold', HEADING)}>{t('verify.bank.instant')}</span>
                <span className={cn('mt-0.5 block text-xs', MUTED_TEXT)}>{t('verify.bank.instant_sub')}</span>
              </span>
            </button>
            <button type="button" onClick={() => void startDeposits()} className={cn(choice(false), methodTile)}>
              <IconChip Icon={Coins} tone="slate" />
              <span>
                <span className={cn('block text-sm font-bold', HEADING)}>{t('verify.bank.deposits')}</span>
                <span className={cn('mt-0.5 block text-xs', MUTED_TEXT)}>{t('verify.bank.deposits_sub')}</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 'instant_failed' && failure && (
        <div role="alert">
          <p className={cn('text-base font-bold', HEADING)}>{t('verify.bank.failed_title')}</p>
          <p className={cn('mt-1 text-sm', BODY_TEXT)}>{t(`verify.bank.failed_${failure}`)}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('verify.close')}</button>
            <button type="button" onClick={() => void startDeposits()} className={PILL_PRIMARY}>{t('verify.bank.use_deposits')}</button>
          </div>
        </div>
      )}

      {step === 'deposits' && (
        <form onSubmit={(e) => void confirmDeposits(e)} noValidate>
          <p className={cn('text-sm', BODY_TEXT)}>{t('verify.bank.deposits_sent', { date: sentOn })}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input id="bv-first" inputMode="decimal" autoComplete="off" placeholder="0.00" label={t('verify.bank.amount_first')} value={first} onChange={(e) => { setFirst(e.target.value.replace(/[^0-9.]/g, '')); setAmountError(false) }} />
            <Input id="bv-second" inputMode="decimal" autoComplete="off" placeholder="0.00" label={t('verify.bank.amount_second')} value={second} onChange={(e) => { setSecond(e.target.value.replace(/[^0-9.]/g, '')); setAmountError(false) }} />
          </div>
          {amountError && <p role="alert" className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{t('verify.bank.amount_error')}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('verify.bank.later')}</button>
            <button type="submit" disabled={!first || !second} className={PILL_PRIMARY}>{t('verify.bank.confirm')}</button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center">
          <span className="mx-auto flex w-fit"><IconChip Icon={BadgeCheck} tone="emerald" /></span>
          <p className={cn('mt-3 text-base font-bold', HEADING)}>{t('verify.bank.done_title')}</p>
          <p className={cn('mt-1 text-sm', BODY_TEXT)}>{t('verify.bank.done_body')}</p>
          <button type="button" onClick={onClose} className={cn(PILL_PRIMARY, 'mt-5')}>{t('verify.done')}</button>
        </div>
      )}
    </>
  )
}

export default BankVerifyDialog
