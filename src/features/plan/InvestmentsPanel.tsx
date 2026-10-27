import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Pencil, X } from 'lucide-react'
import { Modal } from '@/design-system/components/Modal'
import { cn } from '@/lib/cn'
import { useElectionsStore } from './electionsStore'
import {
  PLAN_DEFAULT_ALLOCATION, STYLE_TO_RISK, allocationFor, totalOf,
  type Allocation, type InvestMode, type InvestmentElection, type RiskStyle,
} from './electionsData'
import { PLAN_FUNDS, fundByTicker } from './planFunds'
import { PlanFundsTable } from './PlanFundsTable'
import { RiskQuestionnaire } from './RiskQuestionnaire'

const MODES: InvestMode[] = ['plan_selected', 'own', 'risk_style']
type Scope = 'all' | 'preTax' | 'roth'

const outline = 'rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800'

function AllocationTable({ allocation, editable, onChange }: { allocation: Allocation; editable?: boolean; onChange?: (a: Allocation) => void }) {
  const { t } = useTranslation()
  const tickers = Object.keys(allocation)
  const total = totalOf(allocation)
  const addable = PLAN_FUNDS.filter((f) => !(f.ticker in allocation))

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
        <table className="w-full min-w-[26rem] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">{t('plan.inv.col_investment')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('plan.inv.col_type')}</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">{t('plan.inv.col_election')}</th>
              {editable && <th scope="col" className="w-8 px-1 py-2"><span className="sr-only">{t('profile.d.remove')}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tickers.map((tk) => {
              const f = fundByTicker(tk)
              return (
                <tr key={tk}>
                  <th scope="row" className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                    {f?.name ?? tk}
                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">CUSIP {f?.cusip ?? '—'}</span>
                  </th>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{f?.category ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    {editable ? (
                      <span className="relative inline-block">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={100}
                          aria-label={`${f?.name ?? tk} ${t('plan.inv.col_election')}`}
                          value={allocation[tk]}
                          onChange={(e) => onChange?.({ ...allocation, [tk]: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                          className="h-8 w-20 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-right text-sm tabular-nums text-gray-900 [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </span>
                    ) : (
                      <span className="tabular-nums">{allocation[tk]}%</span>
                    )}
                  </td>
                  {editable && (
                    <td className="px-1 py-2.5 text-center">
                      {tickers.length > 1 && (
                        <button type="button" onClick={() => { const next = { ...allocation }; delete next[tk]; onChange?.(next) }} aria-label={`${t('profile.d.remove')}: ${f?.name ?? tk}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-800/60">
              <td className="px-3 py-2" colSpan={2}>{t('plan.inv.total')}</td>
              <td className={cn('px-3 py-2 text-right tabular-nums', total === 100 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300')}>{total}%</td>
              {editable && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
      {editable && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {addable.length > 0 ? (
            <select
              value=""
              aria-label={t('plan.inv.add_fund')}
              onChange={(e) => e.target.value && onChange?.({ ...allocation, [e.target.value]: 0 })}
              className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">+ {t('plan.inv.add_fund')}</option>
              {addable.map((f) => (
                <option key={f.ticker} value={f.ticker}>{f.name} ({f.ticker})</option>
              ))}
            </select>
          ) : (
            <span />
          )}
          <p role="status" className={cn('flex items-center gap-1.5 text-sm font-medium', total === 100 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300')}>
            {total === 100 ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <AlertTriangle className="h-4 w-4" aria-hidden />}
            {total === 100 ? t('profile.d.shares_ok') : t('plan.inv.total_needs', { total })}
          </p>
        </div>
      )}
    </div>
  )
}

export function InvestmentsPanel() {
  const { t } = useTranslation()
  const election = useElectionsStore((s) => s.investment)
  const save = useElectionsStore((s) => s.saveInvestment)

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<InvestmentElection>(election)
  const [scope, setScope] = useState<Scope>('all')
  const [viewScope, setViewScope] = useState<Scope>('all')
  const [showFunds, setShowFunds] = useState(false)
  const [questionnaire, setQuestionnaire] = useState(false)
  const [sdbConfirm, setSdbConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = () => {
    setDraft(election)
    setScope('all')
    setError(null)
    setSaved(false)
    setEditing(true)
  }

  const activeKey: Scope = draft.applyAllSources ? 'all' : scope
  const setAlloc = (a: Allocation) => setDraft((d) => ({ ...d, mode: 'own', allocations: { ...d.allocations, [activeKey]: a } }))

  const chooseMode = (mode: InvestMode) => {
    if (mode === 'plan_selected') setDraft((d) => ({ ...d, mode, riskStyle: undefined, allocations: { all: PLAN_DEFAULT_ALLOCATION, preTax: PLAN_DEFAULT_ALLOCATION, roth: PLAN_DEFAULT_ALLOCATION } }))
    else if (mode === 'own') setDraft((d) => ({ ...d, mode, riskStyle: undefined }))
    else {
      setDraft((d) => ({ ...d, mode }))
      if (!draft.riskStyle) setQuestionnaire(true)
    }
  }

  const applyStyle = (style: RiskStyle) => {
    const a = allocationFor(STYLE_TO_RISK[style])
    setDraft((d) => ({ ...d, mode: 'risk_style', riskStyle: style, allocations: { all: a, preTax: a, roth: a } }))
    setQuestionnaire(false)
  }

  const toggleApplyAll = (all: boolean) => setDraft((d) => ({ ...d, applyAllSources: all, allocations: all ? { ...d.allocations, preTax: d.allocations.all, roth: d.allocations.all } : { ...d.allocations, preTax: d.allocations.all, roth: d.allocations.all } }))

  const submit = () => {
    if (draft.mode === 'risk_style' && !draft.riskStyle) return setError(t('plan.inv.err_style'))
    const keys: Scope[] = draft.applyAllSources ? ['all'] : ['preTax', 'roth']
    for (const k of keys) {
      if (totalOf(draft.allocations[k]) !== 100) return setError(t('plan.inv.err_total'))
    }
    // Keep the "all" election in step with the pre-tax one when sources differ, so views stay coherent.
    const final: InvestmentElection = draft.applyAllSources ? { ...draft, allocations: { all: draft.allocations.all, preTax: draft.allocations.all, roth: draft.allocations.all } } : { ...draft, allocations: { ...draft.allocations, all: draft.allocations.preTax } }
    save(final, { sdbChanged: final.sdbOptedIn !== election.sdbOptedIn, rebalanceChanged: final.autoRebalance !== election.autoRebalance })
    setEditing(false)
    setSaved(true)
  }

  // ── View mode ──
  if (!editing) {
    const shown = election.applyAllSources ? election.allocations.all : election.allocations[viewScope === 'all' ? 'preTax' : viewScope]
    return (
      <div className="space-y-4">
        {saved && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> {t('profile.d.saved')}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('plan.inv.title')} · {election.applyAllSources ? t('plan.inv.same_all') : t('plan.inv.by_source')}
          </h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowFunds(true)} className={cn(outline, 'py-1.5')}>{t('plan.inv.view_funds')}</button>
            <button type="button" onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> {t('profile.d.edit')}
            </button>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('plan.inv.mode')}</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
              {t(`plan.inv.mode_${election.mode}`)}
              {election.riskStyle && <span className="text-gray-500"> ({t(`plan.risk.style_${election.riskStyle}`)})</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('plan.inv.auto_rebalance')}</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{election.autoRebalance ? t('plan.inv.on') : t('plan.inv.off')}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('plan.inv.sdb')}</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{election.sdbOptedIn ? t('plan.inv.sdb_in') : t('plan.inv.sdb_not')}</dd>
          </div>
        </dl>

        {!election.applyAllSources && (
          <div role="tablist" aria-label={t('plan.inv.by_source')} className="flex gap-1.5">
            {(['preTax', 'roth'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={(viewScope === 'all' ? 'preTax' : viewScope) === k} onClick={() => setViewScope(k)} className={cn('rounded-full border px-3 py-1 text-sm font-medium', (viewScope === 'all' ? 'preTax' : viewScope) === k ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300')}>
                {t(`plan.src_${k}`)}
              </button>
            ))}
          </div>
        )}
        <AllocationTable allocation={shown} />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('plan.inv.sdb_promo')}{' '}
          {!election.sdbOptedIn && <button type="button" onClick={startEdit} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">{t('plan.inv.sdb_opt_in')}</button>}
        </p>

        <Modal open={showFunds} onClose={() => setShowFunds(false)} size="2xl" title={t('plan.inv.plan_investments')}>
          <PlanFundsTable />
        </Modal>
      </div>
    )
  }

  // ── Edit mode ──
  const activeAlloc = draft.allocations[activeKey]
  return (
    <>
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('plan.inv.edit_title')}</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t('plan.inv.edit_sub')}</p>
        </div>
        <button type="button" onClick={() => setShowFunds(true)} className={cn(outline, 'py-1.5')}>{t('plan.inv.view_funds')}</button>
      </div>

      <div role="radiogroup" aria-label={t('plan.inv.mode')} className="grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={draft.mode === m} onClick={() => chooseMode(m)} className={cn('rounded-xl border-2 p-3 text-left transition-colors', draft.mode === m ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700')}>
            <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t(`plan.inv.mode_${m}`)}</span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t(`plan.inv.mode_${m}_sub`)}</span>
          </button>
        ))}
      </div>

      {draft.mode === 'risk_style' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {draft.riskStyle ? t('plan.inv.style_result', { style: t(`plan.risk.style_${draft.riskStyle}`) }) : t('plan.inv.style_none')}
          </p>
          <button type="button" onClick={() => setQuestionnaire(true)} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
            {draft.riskStyle ? t('plan.risk.retake') : t('plan.inv.take_questionnaire')}
          </button>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-800 dark:text-gray-200">
        <input type="checkbox" checked={draft.applyAllSources} onChange={(e) => toggleApplyAll(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
        {t('plan.inv.apply_all')}
      </label>

      {!draft.applyAllSources && (
        <div role="tablist" aria-label={t('plan.inv.by_source')} className="flex gap-1.5">
          {(['preTax', 'roth'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={scope === k || (scope === 'all' && k === 'preTax')} onClick={() => setScope(k)} className={cn('rounded-full border px-3 py-1 text-sm font-medium', (scope === 'all' ? 'preTax' : scope) === k ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300')}>
              {t(`plan.src_${k}`)}
            </button>
          ))}
        </div>
      )}

      <AllocationTable allocation={activeAlloc} editable={draft.mode === 'own'} onChange={setAlloc} />
      {draft.mode !== 'own' && <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">{t('plan.inv.read_only_hint')}</p>}

      <div className="space-y-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" checked={draft.autoRebalance} onChange={(e) => setDraft({ ...draft, autoRebalance: e.target.checked })} className="mt-0.5 h-4 w-4 rounded accent-blue-600" />
          <span>
            <span className="block text-sm font-medium text-gray-900 dark:text-white">{t('plan.inv.auto_rebalance')}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">{t('plan.inv.auto_rebalance_sub')}</span>
          </span>
        </label>
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <span>
            <span className="block text-sm font-medium text-gray-900 dark:text-white">{t('plan.inv.sdb')}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">{t('plan.inv.sdb_sub')}</span>
          </span>
          {draft.sdbOptedIn ? (
            <button type="button" onClick={() => setDraft({ ...draft, sdbOptedIn: false })} className={cn(outline, 'py-1.5')}>{t('plan.inv.sdb_opt_out')}</button>
          ) : (
            <button type="button" onClick={() => setSdbConfirm(true)} className="btn-brand rounded-lg px-4 py-1.5 text-sm font-semibold">{t('plan.inv.sdb_opt_in_btn')}</button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button type="button" onClick={() => setEditing(false)} className={outline}>{t('profile.d.cancel')}</button>
        <button type="submit" className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('profile.d.save')}</button>
      </div>

    </form>
    <RiskQuestionnaire open={questionnaire} onClose={() => setQuestionnaire(false)} onComplete={applyStyle} />
    <Modal open={showFunds} onClose={() => setShowFunds(false)} size="2xl" title={t('plan.inv.plan_investments')}>
      <PlanFundsTable />
    </Modal>
    <Modal open={sdbConfirm} onClose={() => setSdbConfirm(false)} size="md" title={t('plan.inv.sdb_confirm_title')}>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t('plan.inv.sdb_confirm_body')}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={() => setSdbConfirm(false)} className={outline}>{t('profile.d.cancel')}</button>
        <button type="button" onClick={() => { setDraft((d) => ({ ...d, sdbOptedIn: true })); setSdbConfirm(false) }} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('plan.inv.sdb_confirm')}</button>
      </div>
    </Modal>
    </>
  )
}

