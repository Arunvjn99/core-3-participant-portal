import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/design-system/components/Badge'
import { Modal } from '@/design-system/components/Modal'
import { getAppDateLocale } from '@/lib/dateLocale'
import type { Beneficiary, BeneficiaryType } from '../profileData'
import { useProfileStore } from '../profileStore'
import { BeneficiaryForm } from './BeneficiaryForm'
import { ProfileCard } from './ProfileCard'

const TYPES: BeneficiaryType[] = ['primary', 'contingent']

export function BeneficiariesPanel({ startAdding = false }: { startAdding?: boolean }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const beneficiaries = useProfileStore((s) => s.beneficiaries)
  const setShares = useProfileStore((s) => s.setShares)
  const remove = useProfileStore((s) => s.removeBeneficiary)

  const [adding, setAdding] = useState(startAdding)
  const [editType, setEditType] = useState<BeneficiaryType | null>(null)
  const [draftShares, setDraftShares] = useState<Record<string, string>>({})
  const [removeTarget, setRemoveTarget] = useState<Beneficiary | null>(null)

  const totals = useMemo(
    () => Object.fromEntries(TYPES.map((tp) => [tp, beneficiaries.filter((b) => b.type === tp).reduce((s, b) => s + b.share, 0)])) as Record<BeneficiaryType, number>,
    [beneficiaries],
  )
  const countOf = (tp: BeneficiaryType) => beneficiaries.filter((b) => b.type === tp).length

  if (adding) return <BeneficiaryForm onDone={() => setAdding(false)} />

  const openShares = (tp: BeneficiaryType) => {
    setDraftShares(Object.fromEntries(beneficiaries.filter((b) => b.type === tp).map((b) => [b.id, String(b.share)])))
    setEditType(tp)
  }
  const draftTotal = Object.values(draftShares).reduce((s, v) => s + (Number(v) || 0), 0)
  const evenSplit = () => {
    const ids = Object.keys(draftShares)
    const base = Math.floor(100 / ids.length)
    const rem = 100 - base * ids.length
    setDraftShares(Object.fromEntries(ids.map((id, i) => [id, String(base + (i === 0 ? rem : 0))])))
  }
  const saveShares = () => {
    if (draftTotal !== 100) return
    setShares(Object.fromEntries(Object.entries(draftShares).map(([id, v]) => [id, Number(v)])))
    setEditType(null)
  }

  const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  const rows = [...beneficiaries].sort((a, b) => (a.type === b.type ? 0 : a.type === 'primary' ? -1 : 1))
  const problems = TYPES.filter((tp) => countOf(tp) > 0 && totals[tp] !== 100)

  return (
    <>
      <ProfileCard
        title={t('profile.d.beneficiary_title')}
        actions={
          <button type="button" onClick={() => setAdding(true)} className="btn-brand inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold">
            <Plus className="h-4 w-4" aria-hidden />
            {t('profile.d.add_beneficiary')}
          </button>
        }
      >
        {problems.map((tp) => (
          <p key={tp} role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('profile.d.share_problem', { type: t(`profile.d.type_${tp}`), total: totals[tp] })}
          </p>
        ))}

        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.beneficiaries_empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th scope="col" className="py-2 pr-3 font-semibold">{t('profile.d.type')}</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">{t('profile.d.cls_name')}</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">{t('profile.d.relationship')}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">{t('profile.d.share')}</th>
                  <th scope="col" className="py-2 text-right font-semibold">{t('profile.d.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-3"><Badge variant={b.type === 'primary' ? 'success' : 'default'}>{t(`profile.d.type_${b.type}`)}</Badge></td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-gray-900 dark:text-white">{b.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.d.born', { date: fmtDate(b.dob) })}</p>
                    </td>
                    <td className="py-3 pr-3">{t(`profile.d.rel_${b.relationship}`)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{b.share}%</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openShares(b.type)} className="rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30">
                          {t('profile.d.set_pct')}
                        </button>
                        <button type="button" onClick={() => setRemoveTarget(b)} aria-label={`${t('profile.d.remove')}: ${b.name}`} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800">
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ProfileCard>

      <Modal open={editType !== null} onClose={() => setEditType(null)} title={editType ? t('profile.d.set_shares_title', { type: t(`profile.d.type_${editType}`) }) : ''}>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{t('profile.d.set_shares_body')}</p>
        <ul className="space-y-2">
          {beneficiaries.filter((b) => b.type === editType).map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3">
              <label htmlFor={`share-${b.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{b.name}</label>
              <span className="relative">
                <input
                  id={`share-${b.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={draftShares[b.id] ?? ''}
                  onChange={(e) => setDraftShares((d) => ({ ...d, [b.id]: String(Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0)))) }))}
                  className="h-9 w-24 rounded-md border border-gray-200 bg-transparent pl-2 pr-6 text-right text-sm tabular-nums text-gray-900 [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </span>
            </li>
          ))}
        </ul>
        <p role="status" className={`mt-3 text-sm font-medium ${draftTotal === 100 ? 'text-green-600' : 'text-amber-700 dark:text-amber-300'}`}>
          {draftTotal === 100 ? t('profile.d.shares_ok') : t('profile.d.shares_total', { total: draftTotal })}
        </p>
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <button type="button" onClick={evenSplit} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{t('profile.d.split_evenly')}</button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditType(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
            <button type="button" disabled={draftTotal !== 100} onClick={saveShares} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50">{t('profile.d.save')}</button>
          </div>
        </div>
      </Modal>

      <Modal open={removeTarget !== null} onClose={() => setRemoveTarget(null)} title={t('profile.d.remove_title')} size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('profile.d.remove_body', { name: removeTarget?.name ?? '' })}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setRemoveTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
          <button type="button" onClick={() => { if (removeTarget) remove(removeTarget.id); setRemoveTarget(null) }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{t('profile.d.remove')}</button>
        </div>
      </Modal>
    </>
  )
}
