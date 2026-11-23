import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ADVISOR } from '@/features/advisors/advisorProfile'
import { AdvisorAvatar } from '@/features/advisors/AdvisorAvatar'
import { AppIcon } from '@/design-system/icons'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { getAppDateLocale } from '@/lib/dateLocale'
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  Minus,
  Gauge,
  Star,
  Sparkles,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/cn'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { BODY_TEXT, Card, CARD_TITLE, DIVIDE, HEADING, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, RULE, SECTION_LABEL, StepHeader, TEXT_LINK, TitleBadge, badge, card, choice } from '@/features/enrollment/enrollmentUi'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'

/* ─── Types ─── */
import { allocations, fundCatalog, recommendedFunds, type SourceFundAllocation } from '../investmentCatalog'
import { splitWhole } from '../enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'
type SourceKey = 'roth' | 'preTax' | 'afterTax'
interface PerSourceAllocations { sameForAll: boolean; unified: SourceFundAllocation[]; sources: Record<SourceKey, SourceFundAllocation[]> }

const sourceTKey: Record<SourceKey, string> = { roth: 'source_roth', preTax: 'source_preTax', afterTax: 'source_afterTax' }
const sourceTaxTKey: Record<SourceKey, string> = { roth: 'tax_free', preTax: 'tax_deferred', afterTax: 'taxable' }
const sourceColors: Record<SourceKey, string> = { roth: 'var(--chart-purple)', preTax: 'var(--chart-blue)', afterTax: 'var(--chart-green)' }
const sourceBgColors: Record<SourceKey, string> = { roth: 'bg-purple-50', preTax: 'bg-blue-50', afterTax: 'bg-green-50' }

/* ─── Static Data ─── */
const riskLevelKeys = ['conservative', 'balanced', 'growth', 'aggressive'] as const

/** A saved ticker → percent mix as editable fund rows. */
function fundsFromAllocation(map: Record<string, number>): SourceFundAllocation[] {
  return fundCatalog.filter((f) => (map[f.ticker] ?? 0) > 0).map((f) => ({ ...f, allocation: map[f.ticker] }))
}

function allocationMap(funds: SourceFundAllocation[]): Record<string, number> {
  return Object.fromEntries(funds.filter((f) => f.allocation > 0).map((f) => [f.ticker, f.allocation]))
}

/** Plan-default risk shown as a word and as filled dots out of five */
const riskDots: Record<(typeof riskLevelKeys)[number], number> = { conservative: 2, balanced: 3, growth: 4, aggressive: 5 }

function getSourceTotal(funds: SourceFundAllocation[]) {
  return funds.reduce((s, f) => s + f.allocation, 0)
}

type ComputedRiskKey = 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'not_set'

function computeRiskLevel(funds: SourceFundAllocation[]): { riskKey: ComputedRiskKey; color: string } {
  const total = funds.reduce((s, f) => s + f.allocation, 0)
  if (total === 0) return { riskKey: 'not_set', color: 'text-slate-400' }
  // Stock share (US + international) as a percent of the mix. Cut-offs sit between the plan's own
  // portfolios (conservative 40%, balanced 60%, growth 70%) so each one is labelled as itself.
  const eq = (funds.filter((f) => f.assetClass === 'Equity' || f.assetClass === 'International').reduce((s, f) => s + f.allocation, 0) / total) * 100
  if (eq >= 80) return { riskKey: 'aggressive', color: 'text-red-600' }
  if (eq >= 65) return { riskKey: 'growth', color: 'text-orange-600' }
  if (eq >= 50) return { riskKey: 'balanced', color: 'text-blue-600' }
  return { riskKey: 'conservative', color: 'text-green-600' }
}

function AllocationIndicator({ total, label }: { total: number; label?: string }) {
  const { t } = useTranslation()
  const isValid = total === 100
  const diff = total - 100
  const statusText = isValid
    ? t('enrollment.investment.alloc_balanced')
    : diff > 0
      ? t('enrollment.investment.alloc_over', { n: diff })
      : t('enrollment.investment.alloc_remaining', { n: Math.abs(diff) })
  return (
    <div className={`flex items-center justify-between rounded-xl px-3.5 py-2 ${isValid ? 'bg-green-50' : 'bg-amber-50'}`}>
      <div className="flex items-center gap-2">
        {isValid
          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
        <span className={isValid ? 'text-green-700' : 'text-amber-700'} style={{ fontSize: '0.78rem', fontWeight: 500 }}>
          {label ? `${label}: ` : ''}{statusText}
        </span>
      </div>
      <span className={`tabular-nums ${isValid ? 'text-green-800' : 'text-amber-800'}`} style={{ fontSize: '0.9rem', fontWeight: 700 }}>{total}%</span>
    </div>
  )
}

function FundPicker({ existingTickers, onAdd }: { existingTickers: string[]; onAdd: (fund: SourceFundAllocation) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const available = fundCatalog.filter((f) => !existingTickers.includes(f.ticker))
  if (available.length === 0) return null
  const grouped = available.reduce<Record<string, SourceFundAllocation[]>>((acc, f) => {
    if (!acc[f.assetClass]) acc[f.assetClass] = []
    acc[f.assetClass].push(f)
    return acc
  }, {})
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className={cn(TEXT_LINK, 'gap-1.5 py-1.5 text-[13px]')}>
        <Plus className="w-3.5 h-3.5" /> {t('enrollment.investment.add_fund')}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-64 w-72 overflow-y-auto rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/15">
          {Object.entries(grouped).map(([cls, funds]) => (
            <div key={cls}>
              <p className="sticky top-0 bg-white px-3 pb-1 pt-2.5 text-slate-500 dark:bg-slate-900 dark:text-slate-400" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cls}</p>
              {funds.map((fund) => (
                <button type="button" key={fund.ticker} onClick={() => { onAdd({ ...fund, allocation: 0 }); setOpen(false) }} className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <div>
                    <p className={cn('text-[13px] font-medium', HEADING)}>{fund.name}</p>
                    <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem' }}>{fund.ticker} · {t('enrollment.investment.er')} {fund.expense}</p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SourceFundList({ funds, onUpdate, onRemove, onAdd }: { funds: SourceFundAllocation[]; onUpdate: (t: string, v: number) => void; onRemove: (t: string) => void; onAdd: (f: SourceFundAllocation) => void }) {
  const { t } = useTranslation()
  const grouped = funds.reduce<Record<string, SourceFundAllocation[]>>((acc, f) => {
    if (!acc[f.assetClass]) acc[f.assetClass] = []
    acc[f.assetClass].push(f)
    return acc
  }, {})
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([assetClass, classFunds]) => (
        <div key={assetClass}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: classFunds[0].color }} />
            <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{assetClass}</p>
          </div>
          <div className="space-y-2">
            {classFunds.map((fund) => (
              <div key={fund.ticker} className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className={cn('truncate text-[13px] font-semibold', HEADING)}>{fund.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem' }}>{fund.ticker}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem' }}>{t('enrollment.investment.er')} {fund.expense}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button type="button" onClick={() => onUpdate(fund.ticker, Math.max(0, fund.allocation - 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/15"><Minus className="w-3 h-3" /></button>
                    <div className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2.5 py-0.5 dark:bg-white/10">
                      <input type="number" min={0} max={100} value={fund.allocation} onChange={(e) => onUpdate(fund.ticker, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} className="w-9 text-right bg-transparent border-none outline-none text-[#0B1533] dark:text-white tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 600 }} />
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.78rem' }}>%</span>
                    </div>
                    <button type="button" onClick={() => onUpdate(fund.ticker, Math.min(100, fund.allocation + 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/15"><Plus className="w-3 h-3" /></button>
                    <button type="button" onClick={() => onRemove(fund.ticker)} className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <RangeSlider size="sm" min={0} max={100} value={fund.allocation} onChange={(v) => onUpdate(fund.ticker, v)} color={fund.color} aria-label={fund.name} aria-valuetext={`${fund.allocation}%`} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <FundPicker existingTickers={funds.map((f) => f.ticker)} onAdd={onAdd} />
    </div>
  )
}


function PortfolioEditorContent({ allocs, setAllocs }: { allocs: PerSourceAllocations; setAllocs: React.Dispatch<React.SetStateAction<PerSourceAllocations | null>> }) {
  const { t } = useTranslation()
  const updateUnifiedFund = useCallback((ticker: string, value: number) => { setAllocs((p) => p ? ({ ...p, unified: p.unified.map((f) => f.ticker === ticker ? { ...f, allocation: value } : f) }) : p) }, [setAllocs])
  const removeUnifiedFund = useCallback((ticker: string) => { setAllocs((p) => p ? ({ ...p, unified: p.unified.filter((f) => f.ticker !== ticker) }) : p) }, [setAllocs])
  const addUnifiedFund = useCallback((fund: SourceFundAllocation) => { setAllocs((p) => p ? ({ ...p, unified: [...p.unified, fund] }) : p) }, [setAllocs])
  const unifiedTotal = getSourceTotal(allocs.unified)
  const currentFunds = allocs.unified
  const { riskKey, color: riskColor } = computeRiskLevel(currentFunds || [])
  const riskShort =
    riskKey === 'not_set' ? t('enrollment.investment.risk_not_set') : t(`enrollment.investment.risk_short_${riskKey}`)
  const chartData = Object.entries(
    (currentFunds || []).filter((f) => f.allocation > 0).reduce<Record<string, { value: number; color: string }>>((acc, f) => {
      if (!acc[f.assetClass]) acc[f.assetClass] = { value: 0, color: f.color }
      acc[f.assetClass].value += f.allocation
      return acc
    }, {})
  ).map(([name, d]) => ({ name, ...d }))

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {chartData.length > 0 && (
        <div className={cn('flex items-center gap-4 border-b pb-4', RULE)}>
          <div className="w-14 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={16} outerRadius={26} paddingAngle={2} dataKey="value" strokeWidth={0}>{chartData.map((e) => <Cell key={e.name} fill={e.color} />)}</Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-x-4 gap-y-1">{chartData.map((d) => <div key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} /><span className="text-slate-600 dark:text-slate-300" style={{ fontSize: '0.72rem' }}>{d.name}: <span className="text-[#0B1533] dark:text-white" style={{ fontWeight: 600 }}>{d.value}%</span></span></div>)}</div>
            <div className="flex items-center gap-1.5 mt-1.5"><Gauge className="w-3 h-3 text-slate-400" /><span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem' }}>{t('enrollment.investment.risk_label')} <span className={riskColor} style={{ fontWeight: 600 }}>{riskShort}</span></span></div>
          </div>
        </div>
      )}
      <div>
        {allocs.unified.length === 0
          ? <div className="text-center py-8"><p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.85rem' }}>{t('enrollment.investment.no_funds')}</p><div className="mt-3 flex justify-center"><FundPicker existingTickers={[]} onAdd={addUnifiedFund} /></div></div>
          : <SourceFundList funds={allocs.unified} onUpdate={updateUnifiedFund} onRemove={removeUnifiedFund} onAdd={addUnifiedFund} />}
        <div className="mt-4 space-y-2"><AllocationIndicator total={unifiedTotal} label={t('enrollment.investment.total_allocation')} /></div>
      </div>
    </div>
  )
}

function CustomizeModal({ isOpen, onClose, initialAllocations, onSave }: { isOpen: boolean; onClose: () => void; initialAllocations: PerSourceAllocations; activeSources?: SourceKey[]; contributionSources?: { preTax: number; roth: number; afterTax: number }; onSave: (a: PerSourceAllocations) => void; initialTab?: SourceKey }) {
  const { t } = useTranslation()
  const [allocs, setAllocs] = useState<PerSourceAllocations>(initialAllocations)
  const backdropRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isOpen) { setAllocs(initialAllocations); document.body.style.overflow = 'hidden' }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, initialAllocations])
  if (!isOpen) return null
  const unifiedTotal = getSourceTotal(allocs.unified)
  const allValid = unifiedTotal === 100
  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose() }} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1533]/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[24px] bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-[#0B1436] dark:ring-white/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-white/10">
          <div><h2 className={cn('text-lg font-bold', HEADING)}>{t('enrollment.investment.modal_edit_title')}</h2><p className="mt-0.5 text-slate-500 dark:text-slate-400" style={{ fontSize: '0.78rem' }}>{t('enrollment.investment.modal_edit_sub')}</p></div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0B1533] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PortfolioEditorContent allocs={allocs} setAllocs={setAllocs as React.Dispatch<React.SetStateAction<PerSourceAllocations | null>>} />
        </div>
        <div className="border-t border-slate-200/80 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setAllocs(initialAllocations)} className="flex items-center gap-1.5 px-1 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:text-[#0B1533] dark:text-slate-300 dark:hover:text-white"><RotateCcw className="w-3.5 h-3.5" /> {t('enrollment.investment.reset')}</button>
            <div className="flex-1" />
            <button type="button" onClick={onClose} className={PILL_SECONDARY}>{t('enrollment.investment.cancel')}</button>
            <button type="button" onClick={() => { if (allValid) onSave(allocs) }} disabled={!allValid} className={PILL_PRIMARY}><Check className="w-4 h-4" /> {t('enrollment.investment.save_portfolio')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SourceCard({ sourceKey, monthlyAmount, funds, isCustomized, onEditPortfolio }: { sourceKey: SourceKey; monthlyAmount: number; funds: SourceFundAllocation[]; isCustomized: boolean; onEditPortfolio: () => void }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const [expanded, setExpanded] = useState(false)
  const activeFunds = funds.filter((f) => f.allocation > 0)
  const assetSummary = Object.entries(activeFunds.reduce<Record<string, { value: number; color: string }>>((acc, f) => {
    if (!acc[f.assetClass]) acc[f.assetClass] = { value: 0, color: f.color }
    acc[f.assetClass].value += f.allocation
    return acc
  }, {})).map(([name, d]) => ({ name, ...d }))
  return (
    <div className={cn(card('plain', false), 'overflow-hidden')}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sourceColors[sourceKey] }} /><p className="text-[#0B1533] dark:text-white" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t(`enrollment.investment.${sourceTKey[sourceKey]}`)}</p><span className={`${sourceBgColors[sourceKey]} px-1.5 py-0.5 rounded`} style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.03em', color: sourceColors[sourceKey] }}>{t(`enrollment.investment.${sourceTaxTKey[sourceKey]}`)}</span></div>
            <div className="flex items-center gap-3 mt-1.5"><span className="text-slate-600 dark:text-slate-300" style={{ fontSize: '0.82rem', fontWeight: 500 }}>${Math.round(monthlyAmount).toLocaleString(locale)}/mo</span><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.78rem' }}>{activeFunds.length} {activeFunds.length === 1 ? t('enrollment.investment.funds_one') : t('enrollment.investment.funds_other')}</span>{isCustomized && <><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-primary dark:text-blue-300" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{t('enrollment.investment.customized')}</span></>}</div>
          </div>
          <button type="button" onClick={onEditPortfolio} className={cn(TEXT_LINK, 'shrink-0 gap-1.5 text-[13px]')}><Pencil className="h-3.5 w-3.5" />{t('enrollment.investment.edit')}</button>
        </div>
        {assetSummary.length > 0 && (
          <div className="mt-3">
            <div className="flex rounded-full h-2 overflow-hidden">{assetSummary.map((a) => <div key={a.name} style={{ width: `${a.value}%`, backgroundColor: a.color }} className="transition-all" />)}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">{assetSummary.map((a) => <div key={a.name} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} /><span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem' }}>{a.name} <span className="text-slate-600 dark:text-slate-300" style={{ fontWeight: 600 }}>{a.value}%</span></span></div>)}</div>
          </div>
        )}
        {activeFunds.length > 0 && (
          <div className="mt-2.5 space-y-0.5">
            {activeFunds.slice(0, 2).map((f) => <p key={f.ticker} className="truncate text-slate-500 dark:text-slate-400" style={{ fontSize: '0.72rem' }}>{f.name}</p>)}
            {activeFunds.length > 2 && <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.68rem' }}>{t('enrollment.investment.more_funds', { n: activeFunds.length - 2 })}</p>}
          </div>
        )}
      </div>
      {activeFunds.length > 0 && (
        <>
          <button type="button" onClick={() => setExpanded(!expanded)} className="w-full border-t border-slate-200/80 dark:border-white/10 px-4 py-2 flex items-center justify-center gap-1.5 text-slate-500 hover:bg-slate-50 hover:text-[#0B1533] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{expanded ? t('enrollment.investment.hide_funds') : t('enrollment.investment.view_funds')}{expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
          {expanded && <div className="border-t border-slate-200/80 dark:border-white/10 px-4 py-3 space-y-2">{activeFunds.map((f) => <div key={f.ticker} className="flex items-center justify-between py-1"><div><p className="text-slate-600 dark:text-slate-300" style={{ fontSize: '0.78rem' }}>{f.name}</p><p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.65rem' }}>{f.ticker} · {t('enrollment.investment.er')} {f.expense}</p></div><span className="text-[#0B1533] dark:text-white tabular-nums" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{f.allocation}%</span></div>)}</div>}
        </>
      )}
    </div>
  )
}

function InactiveSourceCard({ sourceKey }: { sourceKey: SourceKey }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3.5 opacity-60 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-white/10">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sourceColors[sourceKey] }} />
      <div><p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t(`enrollment.investment.${sourceTKey[sourceKey]}`)}</p><p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.72rem' }}>{t('enrollment.investment.inactive')}</p></div>
    </div>
  )
}

/* ─── Main Component ─── */
function InvestmentStrategy() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization } = useEnrollment()
  const [showRiskEditor, setShowRiskEditor] = useState(false)
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [showBuildPortfolioModal, setShowBuildPortfolioModal] = useState(false)
  const [editingSource, setEditingSource] = useState<SourceKey | null>(null)
  const [modalInitialTab, setModalInitialTab] = useState<SourceKey>('preTax')
  // One custom mix applies to every source; restored from the draft when coming back to this step
  const [customAllocations, setCustomAllocations] = useState<PerSourceAllocations | null>(() => {
    if (!data.customAllocation) return null
    const funds = fundsFromAllocation(data.customAllocation)
    return { sameForAll: true, unified: funds, sources: { roth: funds, preTax: funds, afterTax: funds } }
  })
  const [hasConfirmedPlanDefault, setHasConfirmedPlanDefault] = useState(false)
  const [inlineAllocs, setInlineAllocs] = useState<PerSourceAllocations | null>(null)

  const currentAllocation = allocations[data.riskLevel] ?? allocations['balanced']
  const defaultFunds = recommendedFunds(data.riskLevel)
  // Plan-default card facts, from the same growth rate the projections use
  const growthPct = Math.round(getGrowthRate(data.riskLevel) * 1000) / 10
  const yearsToRetirement = personalization.retirementAge - personalization.currentAge

  /** Saves a custom mix with the risk level it works out to, so projections use the matching growth rate.
   *  The plan's own lineup, unedited, keeps the risk level already chosen. */
  const persistCustom = (allocs: PerSourceAllocations) => {
    const mix = allocationMap(allocs.unified)
    const planMix = allocationMap(recommendedFunds(data.riskLevel))
    if (JSON.stringify(mix) === JSON.stringify(planMix)) {
      updateData({ customAllocation: mix, useRecommendedPortfolio: false })
      return
    }
    const { riskKey } = computeRiskLevel(allocs.unified)
    updateData({
      customAllocation: allocationMap(allocs.unified),
      useRecommendedPortfolio: false,
      ...(riskKey !== 'not_set' ? { riskLevel: riskKey } : {}),
    })
  }

  const activeSources: SourceKey[] = []
  if (data.contributionSources.roth > 0) activeSources.push('roth')
  if (data.contributionSources.preTax > 0) activeSources.push('preTax')
  if (data.supportsAfterTax && data.contributionSources.afterTax > 0) activeSources.push('afterTax')
  if (activeSources.length === 0) activeSources.push('preTax')

  const allSources: SourceKey[] = ['roth', 'preTax', 'afterTax']
  const inactiveSources = allSources.filter((s) => !activeSources.includes(s) && (s !== 'afterTax' || data.supportsAfterTax))

  // The editor builds one mix for all sources, so every source card shows that mix
  const getFundsForSource = () => customAllocations ? customAllocations.unified : defaultFunds
  const isSourceCustomized = () => !!customAllocations
  // Same whole-dollar split as the Source step, so the amounts match there
  const monthlyTotal = Math.round((data.salary * data.contributionPercent) / 100 / 12)
  const [monthlyPreTax, monthlyRoth, monthlyAfterTax] = splitWhole(monthlyTotal, [data.contributionSources.preTax, data.contributionSources.roth, data.contributionSources.afterTax])
  const monthlyBySource: Record<SourceKey, number> = { preTax: monthlyPreTax, roth: monthlyRoth, afterTax: monthlyAfterTax }
  const getMonthlyForSource = (src: SourceKey) => monthlyBySource[src]

  // Whatever the cards show is what gets saved
  const handleNext = useCallback(() => {
    if (customAllocations) persistCustom(customAllocations)
    else updateData({ useRecommendedPortfolio: true, customAllocation: null })
    navigate('/enrollment/readiness')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateData, customAllocations, navigate])

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/auto-increase'),
      onNext: handleNext,
      primaryLabel: t('enrollment.next') as EnrollmentPrimaryLabel,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, handleNext, t])

  const handleOpenCustomize = (sourceKey: SourceKey) => {
    const initial: PerSourceAllocations = customAllocations || {
      sameForAll: true,
      unified: defaultFunds.map((f) => ({ ...f })),
      sources: { roth: defaultFunds.map((f) => ({ ...f })), preTax: defaultFunds.map((f) => ({ ...f })), afterTax: defaultFunds.map((f) => ({ ...f })) },
    }
    if (showBuildPortfolioModal) { setInlineAllocs(initial); setEditingSource(sourceKey) }
    else { setCustomAllocations(initial); setModalInitialTab(sourceKey); setShowCustomizeModal(true) }
  }

  const handleSaveCustom = (allocs: PerSourceAllocations) => { setCustomAllocations(allocs); persistCustom(allocs); setShowCustomizeModal(false) }
  const handleSaveInline = () => { if (inlineAllocs) { setCustomAllocations(inlineAllocs); persistCustom(inlineAllocs) } setEditingSource(null) }
  const handleCloseInline = () => { setEditingSource(null); setInlineAllocs(null) }
  /** "Done" in the builder: choose "I Choose My Own Investments" with the mix built so far (the plan's funds if nothing was edited) */
  const handleDoneBuilding = () => {
    const allocs: PerSourceAllocations = customAllocations || {
      sameForAll: true,
      unified: defaultFunds.map((f) => ({ ...f })),
      sources: { roth: defaultFunds.map((f) => ({ ...f })), preTax: defaultFunds.map((f) => ({ ...f })), afterTax: defaultFunds.map((f) => ({ ...f })) },
    }
    setCustomAllocations(allocs)
    persistCustom(allocs)
    setHasConfirmedPlanDefault(false)
    setShowBuildPortfolioModal(false)
    setEditingSource(null)
    setInlineAllocs(null)
  }

  const confirmPlanDefaultChoice = useCallback(() => {
    setHasConfirmedPlanDefault(true)
    updateData({ useRecommendedPortfolio: true, customAllocation: null })
  }, [updateData])

  const handleSelectPlanDefault = useCallback(() => {
    setCustomAllocations(null)
    setShowCustomizeModal(false)
    setShowBuildPortfolioModal(false)
    setEditingSource(null)
    setInlineAllocs(null)
    setHasConfirmedPlanDefault(true)
    updateData({ useRecommendedPortfolio: true, customAllocation: null })
  }, [updateData])

  return (
    <AnimatedPage>
      <div>
        <StepHeader className="mb-5" title={t('enrollment.investment.title')} subtitle={t('enrollment.investment.subtitle')} />

        <div className="space-y-4">
          {/* ── Investment Style Card ── */}
          <Card tone="blue" className="!py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <TitleBadge Icon={Gauge} />
                <div className="min-w-0">
                  <p className={SECTION_LABEL}>{t('enrollment.investment.investment_style')}</p>
                  <p className={cn('text-[17px] font-bold leading-tight', HEADING)}>{t(`enrollment.investment.profile_${data.riskLevel}`)}</p>
                  <p className={cn('mt-0.5 text-xs', BODY_TEXT)}>{t(`enrollment.investment.profile_desc_${data.riskLevel}`)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRiskEditor(!showRiskEditor)} aria-expanded={showRiskEditor} className={cn(PILL_SECONDARY, 'h-9 shrink-0 text-[13px]')}>
                <Pencil className="h-3.5 w-3.5" /> {t('enrollment.investment.edit_strategy')}
              </button>
            </div>
            {showRiskEditor && (
              <div className={cn('mt-4 border-t pt-4', RULE)}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {riskLevelKeys.map((levelKey) => (
                    <button
                      type="button"
                      key={levelKey}
                      onClick={() => { updateData({ riskLevel: levelKey, customAllocation: null, useRecommendedPortfolio: true }); setShowRiskEditor(false); setCustomAllocations(null) }}
                      aria-pressed={data.riskLevel === levelKey}
                      className={cn(choice(data.riskLevel === levelKey), 'p-3 text-center')}
                    >
                      <p className={cn('text-sm font-bold', HEADING)}>{t(`enrollment.investment.level_${levelKey}`)}</p>
                      <p className={cn('mt-0.5 text-xs', MUTED_TEXT)}>{t(`enrollment.investment.level_desc_${levelKey}`)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ── The two ways to invest ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Plan Default Investment */}
            <Card tone={customAllocations ? 'plain' : 'selected'} className="flex flex-col">
              <span className={cn(badge('blue'), 'self-start')}>{t('enrollment.investment.recommended')}</span>
              <div className="mt-2 flex items-center gap-3">
                <TitleBadge Icon={CheckCircle2} />
                <h2 className={cn('text-lg font-bold leading-tight', HEADING)}>{t('enrollment.investment.plan_default_title')}</h2>
              </div>
              <p className={cn('mt-3 text-[13px]', BODY_TEXT)}>{t('enrollment.investment.plan_default_sub')}</p>

              {/* Return, risk and timeline as three figures between two rules */}
              <dl className={cn('mt-4 grid grid-cols-3 divide-x border-y py-3', RULE, DIVIDE)}>
                <div className="pr-3">
                  <dt className={cn('text-[11px]', MUTED_TEXT)}>{t('enrollment.investment.return_label')}</dt>
                  <dd className={cn('mt-0.5 text-sm font-bold', HEADING)}>{t('enrollment.investment.return_value', { rate: growthPct })}</dd>
                </div>
                <div className="px-3">
                  <dt className={cn('text-[11px]', MUTED_TEXT)}>{t('enrollment.investment.risk_label')}</dt>
                  <dd className={cn('mt-0.5 flex items-center gap-1.5 text-sm font-bold', HEADING)}>
                    {t(`enrollment.investment.risk_word_${data.riskLevel}`)}
                    <span className="flex gap-0.5" aria-hidden>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn('h-1.5 w-1.5 rounded-full', n <= riskDots[data.riskLevel] ? 'bg-[#0B1533] dark:bg-white' : 'bg-slate-200 dark:bg-white/15')} />
                      ))}
                    </span>
                  </dd>
                </div>
                <div className="pl-3">
                  <dt className={cn('text-[11px]', MUTED_TEXT)}>{t('enrollment.investment.timeline_label')}</dt>
                  <dd className={cn('mt-0.5 text-sm font-bold', HEADING)}>{t('enrollment.investment.timeline_value', { years: yearsToRetirement })}</dd>
                </div>
              </dl>

              <ul className="mt-4 space-y-2.5">
                {currentAllocation.map((a) => (
                  <li key={a.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} aria-hidden />
                      <span className={cn('text-[13px]', BODY_TEXT)}>{a.name}</span>
                    </span>
                    <span className={cn('text-sm font-bold tabular-nums', HEADING)}>{a.value}%</span>
                  </li>
                ))}
              </ul>

              <div className={cn('mt-4 flex-1 border-t pt-4', RULE)}>
                <p className={cn('text-[13px] font-bold', HEADING)}>{t('enrollment.investment.why_title')}</p>
                <p className={cn('mt-0.5 text-xs leading-relaxed', BODY_TEXT)}>{t('enrollment.investment.why_body', { desc: t(`enrollment.investment.level_desc_${data.riskLevel}`), years: yearsToRetirement })}</p>
              </div>

              <div className="mt-5">
                {customAllocations ? (
                  <button type="button" onClick={handleSelectPlanDefault} className={cn(PILL_SECONDARY, 'w-full')}>
                    {t('enrollment.investment.select_plan_default')}
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                ) : !hasConfirmedPlanDefault ? (
                  <button type="button" onClick={confirmPlanDefaultChoice} className={cn(PILL_PRIMARY, 'w-full')}>
                    {t('enrollment.investment.select_plan_default')}
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                ) : (
                  <div className={cn(PILL_PRIMARY, 'pointer-events-none w-full')} role="status">
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    {t('enrollment.investment.selected_plan_default')}
                  </div>
                )}
              </div>
            </Card>

            {/* Customize Portfolio */}
            <Card tone={customAllocations ? 'selected' : 'plain'} className="flex flex-col">
              <span className={cn(badge('violet'), 'self-start')}>{t('enrollment.investment.advanced_user')}</span>
              <div className="mt-2 flex items-center gap-3">
                <TitleBadge Icon={Settings} color="bg-violet-600" />
                <h2 className={cn('text-lg font-bold leading-tight', HEADING)}>{t('enrollment.investment.customize_title')}</h2>
              </div>
              <p className={cn('mt-3 text-[13px] leading-relaxed', BODY_TEXT)}>{t('enrollment.investment.customize_sub')}</p>
              <p className={cn('mt-3 flex-1 text-[13px] font-semibold leading-relaxed', HEADING)}>{t('enrollment.investment.customize_for')}</p>
              {customAllocations ? (
                <div className={cn(PILL_PRIMARY, 'pointer-events-none mt-5 w-full')} role="status">
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {t('enrollment.investment.selected_custom')}
                </div>
              ) : (
                <button type="button" onClick={() => setShowBuildPortfolioModal(true)} className={cn(PILL_SECONDARY, 'mt-5 w-full')}>
                  {t('enrollment.investment.customize_cta')} <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </Card>
          </div>

          {/* ── Advisor Card ── */}
          <Card tone="warm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-0">
              {/* Who you'd talk to: the dashboard's advisor, with her photo, role and rating */}
              <div className="flex items-center gap-3 md:w-[292px] md:shrink-0 md:border-r md:border-slate-200/80 md:pr-6 md:dark:border-white/10">
                <span className="relative shrink-0">
                  <AdvisorAvatar />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-slate-900" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-tight text-slate-900 dark:text-white">{ADVISOR.name}</p>
                  <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{t('postDashboard.advisor_title_role')}</p>
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-600 dark:text-slate-300">
                    <AppIcon icon={Star} size="inline" className="text-amber-500 dark:text-amber-300" />
                    {t('pre_dashboard.advisor_meta', { years: ADVISOR.years, rating: ADVISOR.rating })}
                  </p>
                </div>
              </div>

              {/* What she can help with: one heading and one line (the badge and ticks only repeated them) */}
              <div className="min-w-0 flex-1 md:px-6">
                <h2 className={CARD_TITLE}>{t('enrollment.investment.advisor_title')}</h2>
                <p className={cn('mt-1 text-[13px] leading-relaxed', BODY_TEXT)}>{t('enrollment.investment.advisor_sub')}</p>
              </div>

              {/* Opens a conversation with her (it did nothing before) */}
              <button type="button" onClick={() => navigate('/advisor?tab=messages', { state: { from: 'enrollment-investment' } })} className={cn(PILL_SECONDARY, 'shrink-0 self-start md:self-center')}>
                {t('enrollment.investment.connect_now')} <AppIcon icon={ChevronRight} />
              </button>
            </div>
          </Card>
        </div>

        {/* Customize Modal */}
        <CustomizeModal
          isOpen={showCustomizeModal}
          onClose={() => setShowCustomizeModal(false)}
          initialAllocations={customAllocations || { sameForAll: activeSources.length === 1, unified: defaultFunds.map((f) => ({ ...f })), sources: { roth: defaultFunds.map((f) => ({ ...f })), preTax: defaultFunds.map((f) => ({ ...f })), afterTax: defaultFunds.map((f) => ({ ...f })) } }}
          activeSources={activeSources}
          contributionSources={data.contributionSources}
          onSave={handleSaveCustom}
          initialTab={modalInitialTab}
        />

        {/* Build Portfolio Modal */}
        {showBuildPortfolioModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1533]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-[#0B1436] dark:ring-white/10">
              <div className="px-6 py-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="mb-1.5 flex items-center gap-3">
                    <TitleBadge Icon={Sparkles} />
                    <h2 className={cn('text-xl font-bold', HEADING)}>{t('enrollment.investment.build_modal_title')}</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '0.85rem' }}>{editingSource ? t('enrollment.investment.build_modal_sub_edit', { source: t(`enrollment.investment.${sourceTKey[editingSource]}`) }) : t('enrollment.investment.build_modal_sub_select')}</p>
                </div>
                <button type="button" onClick={() => { setShowBuildPortfolioModal(false); setEditingSource(null); setInlineAllocs(null) }} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0B1533] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className={`${editingSource ? 'md:w-2/5' : 'w-full'} border-r border-slate-200/80 dark:border-white/10 overflow-y-auto px-6 py-5 transition-all`}>
                  <p className="text-[#0B1533] dark:text-white mb-4" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('enrollment.investment.sources_heading')}</p>
                  <div className="space-y-3">
                    {activeSources.map((src) => <SourceCard key={src} sourceKey={src} monthlyAmount={getMonthlyForSource(src)} funds={getFundsForSource()} isCustomized={isSourceCustomized()} onEditPortfolio={() => handleOpenCustomize(src)} />)}
                    {inactiveSources.map((src) => <InactiveSourceCard key={src} sourceKey={src} />)}
                  </div>
                </div>
                {editingSource && inlineAllocs && (
                  <div className="flex flex-1 flex-col md:w-3/5">
                    <div className={cn('border-b px-6 py-4', RULE)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sourceColors[editingSource] }} /><h3 className="text-[#0B1533] dark:text-white" style={{ fontSize: '1rem', fontWeight: 600 }}>{t('enrollment.investment.customize_source', { source: t(`enrollment.investment.${sourceTKey[editingSource]}`) })}</h3></div>
                        <button type="button" onClick={handleCloseInline} className="text-slate-500 transition-colors hover:text-[#0B1533] dark:text-slate-400 dark:hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      <PortfolioEditorContent allocs={inlineAllocs} setAllocs={setInlineAllocs} />
                    </div>
                    <div className={cn('border-t px-6 py-4', RULE)}>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={handleCloseInline} className={cn(PILL_SECONDARY, 'flex-1')}>{t('enrollment.investment.cancel')}</button>
                        <button type="button" onClick={handleSaveInline} className={cn(PILL_PRIMARY, 'flex-1')}><Check className="w-4 h-4" /> {t('enrollment.investment.save_changes')}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={cn('border-t px-6 py-4', RULE)}>
                <button type="button" onClick={handleDoneBuilding} className={cn(PILL_PRIMARY, 'w-full')}>{t('enrollment.investment.done')} <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}

export default InvestmentStrategy
