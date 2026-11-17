import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/design-system/components/Modal'
import { cn } from '@/lib/cn'
import { BODY_TEXT, HEADING, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, choice } from '@/features/enrollment/enrollmentUi'
import { addressLines, type AddressResult, type PostalAddress } from './verificationService'

/**
 * Shown when the address the participant typed is not deliverable exactly as written: either a standardized
 * version to accept, or a note that it could not be matched, with the choice to fix it or keep it.
 */
export function AddressCheckDialog({
  result,
  entered,
  onUse,
  onEdit,
}: {
  /** `null` keeps the dialog closed. A `verified` result never opens it. */
  result: Exclude<AddressResult, { status: 'verified' }> | null
  entered: PostalAddress
  /** Save with this address; `verified` says whether it is the standardized one. */
  onUse: (address: PostalAddress, verified: boolean) => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const [pick, setPick] = useState<'suggested' | 'entered'>('suggested')

  // Back to the form: the next check starts on the suggested address again
  const edit = () => {
    setPick('suggested')
    onEdit()
  }

  const option = (id: 'suggested' | 'entered', address: PostalAddress) => (
    <button
      type="button"
      role="radio"
      aria-checked={pick === id}
      onClick={() => setPick(id)}
      className={cn(choice(pick === id), 'w-full px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/70')}
    >
      <span className={cn('block text-xs font-semibold', MUTED_TEXT)}>{t(`verify.address.${id}`)}</span>
      {addressLines(address).map((line) => (
        <span key={line} className={cn('block text-sm font-semibold', HEADING)}>{line}</span>
      ))}
    </button>
  )

  return (
    <Modal open={result !== null} onClose={edit} title={t(result?.status === 'unverified' ? 'verify.address.unverified_title' : 'verify.address.corrected_title')} size="md">
      {result?.status === 'corrected' && (
        <div>
          <p className={cn('text-sm', BODY_TEXT)}>{t('verify.address.corrected_body')}</p>
          <div role="radiogroup" aria-label={t('verify.address.corrected_title')} className="mt-4 grid gap-3">
            {option('suggested', result.address)}
            {option('entered', entered)}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={edit} className={PILL_SECONDARY}>{t('verify.address.edit')}</button>
            <button type="button" onClick={() => (pick === 'suggested' ? onUse(result.address, true) : onUse(entered, false))} className={PILL_PRIMARY}>
              {t('verify.address.use')}
            </button>
          </div>
        </div>
      )}

      {result?.status === 'unverified' && (
        <div>
          <p className={cn('text-sm', BODY_TEXT)}>{t(`verify.address.issue_${result.issue}`)}</p>
          <p className={cn('mt-3 text-sm font-semibold', HEADING)}>
            {addressLines(entered).map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => onUse(entered, false)} className={PILL_SECONDARY}>{t('verify.address.keep')}</button>
            <button type="button" onClick={edit} className={PILL_PRIMARY}>{t('verify.address.edit')}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AddressCheckDialog
