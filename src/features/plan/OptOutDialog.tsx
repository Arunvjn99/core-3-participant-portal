import { useTranslation } from 'react-i18next'
import { Modal } from '@/design-system/components/Modal'
import { useElectionsStore } from './electionsStore'

export function OptOutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const optOut = useElectionsStore((s) => s.optOut)
  return (
    <Modal open={open} onClose={onClose} size="md" title={t('plan.opt.title')}>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t('plan.opt.body')}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
        <button type="button" onClick={() => { optOut(); onClose() }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{t('plan.opt.confirm')}</button>
      </div>
    </Modal>
  )
}
