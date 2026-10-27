import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'
import { PLAN_CONFIG, PLAN_LIMITS, employerMatch } from '../agent/planConfig'
import { recommendedFunds } from '../investmentCatalog'
import { ChipGroup, RadioList, RangeField } from './Controls'
import { FlowModal } from './FlowModal'
import { ghostBtn, primaryBtn } from './styles'
import type { EditTarget, PlanChoice } from './flowTypes'

/** Changes one part of the prepared enrolment in a small pop-up. Nothing changes until "Save". */
export function EditModal({
  target,
  plan,
  salary,
  periods,
  onSave,
  onClose,
}: {
  target: EditTarget | null
  plan: PlanChoice
  salary: number
  periods: number
  onSave: (p: PlanChoice) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const [draft, setDraft] = useState<PlanChoice>(plan)
  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`
  const cap = PLAN_CONFIG.match.capPercent
  const fee = (r: PlanChoice['risk']) => recommendedFunds(r).reduce((s, f) => s + (f.allocation * parseFloat(f.expense)) / 100, 0).toFixed(2)

  const labels: Record<EditTarget, string> = {
    rate: t('enrollment.flow.edit_rate'),
    tax: t('enrollment.flow.q_tax'),
    auto: t('enrollment.flow.edit_auto'),
    risk: t('enrollment.flow.edit_risk'),
  }

  return (
    <FlowModal
      open={target !== null}
      onClose={onClose}
      label={target ? labels[target] : ''}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            {t('profile.d.cancel')}
          </button>
          <button type="button" onClick={() => onSave(draft)} className={primaryBtn} style={{ fontWeight: 700 }}>
            <Check className="h-4 w-4" aria-hidden />
            {t('enrollment.flow.save')}
          </button>
        </>
      }
    >
      {target === 'rate' && (
        <div className="space-y-4">
          <RangeField
            label={labels.rate}
            value={draft.rate}
            min={PLAN_LIMITS.rate[0]}
            max={PLAN_LIMITS.rate[1]}
            onChange={(v) => setDraft((d) => ({ ...d, rate: v }))}
            format={(v) => `${v}%`}
          />
          <p className="text-center text-slate-600 dark:text-gray-300" style={{ fontSize: '0.95rem' }} aria-live="polite">
            {t('enrollment.flow.rate_line', { amount: money((salary * draft.rate) / 100 / periods), match: money(employerMatch(salary, draft.rate)) })}
          </p>
          <p className={draft.rate >= cap ? 'text-center text-emerald-700 dark:text-emerald-300' : 'text-center text-amber-700 dark:text-amber-300'} style={{ fontSize: '0.88rem' }}>
            {draft.rate >= cap ? t('enrollment.flow.match_full', { cap }) : t('enrollment.flow.match_gap', { cap, amount: money(employerMatch(salary, cap) - employerMatch(salary, draft.rate)) })}
          </p>
        </div>
      )}

      {target === 'tax' && (
        <RadioList
          label={labels.tax}
          value={draft.tax}
          onChange={(v) => setDraft((d) => ({ ...d, tax: v }))}
          options={(['pretax', 'roth', 'mix'] as const).map((m) => ({ value: m, title: t(`enrollment.quick.opt_${m}_title`), desc: t(`enrollment.quick.opt_${m}_desc`) }))}
        />
      )}

      {target === 'auto' && (
        <div className="space-y-5">
          <RadioList
            label={labels.auto}
            value={draft.auto.enabled ? 'on' : 'off'}
            onChange={(v) => setDraft((d) => ({ ...d, auto: { ...d.auto, enabled: v === 'on' } }))}
            options={[
              { value: 'on', title: t('enrollment.flow.auto_on'), desc: t('enrollment.flow.auto_on_desc') },
              { value: 'off', title: t('enrollment.flow.auto_off'), desc: t('enrollment.flow.auto_off_desc') },
            ]}
          />
          {draft.auto.enabled && (
            <>
              <div>
                <p className="mb-2 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('enrollment.flow.auto_step')}</p>
                <ChipGroup
                  label={t('enrollment.flow.auto_step')}
                  value={draft.auto.amount}
                  onChange={(v) => setDraft((d) => ({ ...d, auto: { ...d.auto, amount: v } }))}
                  options={[1, 2, 3].map((v) => ({ value: v, label: `+${v}%` }))}
                />
              </div>
              <div>
                <p className="mb-2 text-slate-600 dark:text-gray-300" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('enrollment.flow.auto_cap')}</p>
                <ChipGroup
                  label={t('enrollment.flow.auto_cap')}
                  value={draft.auto.max}
                  onChange={(v) => setDraft((d) => ({ ...d, auto: { ...d.auto, max: v } }))}
                  options={[10, 12, 15].map((v) => ({ value: v, label: `${v}%` }))}
                />
              </div>
            </>
          )}
        </div>
      )}

      {target === 'risk' && (
        <RadioList
          label={labels.risk}
          value={draft.risk}
          onChange={(v) => setDraft((d) => ({ ...d, risk: v }))}
          options={(['conservative', 'balanced', 'growth', 'aggressive'] as const).map((r) => ({
            value: r,
            title: t(`enrollment.investment.level_${r}`),
            desc: `${t(`enrollment.agent.risk_short_${r}`)} · ${t('enrollment.flow.funds_fee', { count: recommendedFunds(r).length, fee: fee(r) })}`,
          }))}
        />
      )}
    </FlowModal>
  )
}
