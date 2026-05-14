import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { getAppDateLocale } from '@/lib/dateLocale'
import {
  ArrowRight,
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
  Phone,
  Sparkles,
  Settings,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'

/* ─── Types ─── */
interface FundDetail { name: string; ticker: string; expense: string }
interface AllocationEntry { name: string; value: number; color: string; funds: FundDetail[] }
interface SourceFundAllocation { name: string; ticker: string; expense: string; assetClass: string; color: string; allocation: number }
type SourceKey = 'roth' | 'preTax' | 'afterTax'
interface PerSourceAllocations { sameForAll: boolean; unified: SourceFundAllocation[]; sources: Record<SourceKey, SourceFundAllocation[]> }

const sourceTKey: Record<SourceKey, string> = { roth: 'source_roth', preTax: 'source_preTax', afterTax: 'source_afterTax' }
const sourceTaxTKey: Record<SourceKey, string> = { roth: 'tax_free', preTax: 'tax_deferred', afterTax: 'taxable' }
const sourceColors: Record<SourceKey, string> = { roth: 'var(--chart-purple)', preTax: 'var(--chart-blue)', afterTax: 'var(--chart-green)' }
const sourceBorderColors: Record<SourceKey, string> = { roth: 'border-purple-200', preTax: 'border-blue-200', afterTax: 'border-green-200' }
const sourceBgColors: Record<SourceKey, string> = { roth: 'bg-purple-50', preTax: 'bg-blue-50', afterTax: 'bg-green-50' }

/* ─── Static Data ─── */
const allocations: Record<string, AllocationEntry[]> = {
  conservative: [
    { name: 'Bonds', value: 45, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }, { name: 'PIMCO Income Fund', ticker: 'PONAX', expense: '0.59%' }] },
    { name: 'US Stocks', value: 25, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }] },
    { name: 'International Stocks', value: 15, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }] },
    { name: 'Real Estate', value: 15, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
  balanced: [
    { name: 'US Stocks', value: 40, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }, { name: 'Vanguard Mid-Cap Index', ticker: 'VIMAX', expense: '0.05%' }] },
    { name: 'Bonds', value: 25, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }] },
    { name: 'International Stocks', value: 20, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }] },
    { name: 'Real Estate', value: 15, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
  growth: [
    { name: 'US Stocks', value: 50, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }, { name: 'Vanguard Growth Index', ticker: 'VIGAX', expense: '0.05%' }] },
    { name: 'International Stocks', value: 20, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }] },
    { name: 'Bonds', value: 20, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }] },
    { name: 'Real Estate', value: 10, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
  aggressive: [
    { name: 'US Stocks', value: 50, color: 'var(--chart-green)', funds: [{ name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%' }, { name: 'Vanguard Small-Cap Growth', ticker: 'VSGAX', expense: '0.07%' }] },
    { name: 'International Stocks', value: 20, color: 'var(--chart-purple)', funds: [{ name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%' }, { name: 'Vanguard Emerging Markets', ticker: 'VEMAX', expense: '0.14%' }] },
    { name: 'Bonds', value: 20, color: 'var(--chart-blue)', funds: [{ name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%' }] },
    { name: 'Real Estate', value: 10, color: 'var(--chart-amber)', funds: [{ name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%' }] },
  ],
}

const riskLevelKeys = ['conservative', 'balanced', 'growth', 'aggressive'] as const

const fundCatalog: SourceFundAllocation[] = [
  { name: 'Vanguard Total Stock Market', ticker: 'VTSAX', expense: '0.04%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Mid-Cap Index', ticker: 'VIMAX', expense: '0.05%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Growth Index', ticker: 'VIGAX', expense: '0.05%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Small-Cap Growth', ticker: 'VSGAX', expense: '0.07%', assetClass: 'Equity', color: 'var(--chart-green)', allocation: 0 },
  { name: 'Vanguard Total Bond Market', ticker: 'VBTLX', expense: '0.05%', assetClass: 'Fixed Income', color: 'var(--chart-blue)', allocation: 0 },
  { name: 'PIMCO Income Fund', ticker: 'PONAX', expense: '0.59%', assetClass: 'Fixed Income', color: 'var(--chart-blue)', allocation: 0 },
  { name: 'International Growth Fund', ticker: 'VWIGX', expense: '0.42%', assetClass: 'International', color: 'var(--chart-purple)', allocation: 0 },
  { name: 'Vanguard Emerging Markets', ticker: 'VEMAX', expense: '0.14%', assetClass: 'International', color: 'var(--chart-purple)', allocation: 0 },
  { name: 'Vanguard Real Estate Index', ticker: 'VGSLX', expense: '0.12%', assetClass: 'Real Estate', color: 'var(--chart-amber)', allocation: 0 },
]

function buildFundsFromRecommended(alloc: AllocationEntry[]): SourceFundAllocation[] {
  return fundCatalog.map((fund) => {
    const matched = alloc.find((cat) => cat.funds.some((f) => f.ticker === fund.ticker))
    if (!matched) return null
    return { ...fund, allocation: Math.round(matched.value / matched.funds.length) }
  }).filter((f): f is SourceFundAllocation => f !== null)
}

function getSourceTotal(funds: SourceFundAllocation[]) {
  return funds.reduce((s, f) => s + f.allocation, 0)
}

type ComputedRiskKey = 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'not_set'

function computeRiskLevel(funds: SourceFundAllocation[]): { riskKey: ComputedRiskKey; color: string } {
  const total = funds.reduce((s, f) => s + f.allocation, 0)
  if (total === 0) return { riskKey: 'not_set', color: 'text-gray-400' }
  const eq = funds.filter((f) => f.assetClass === 'Equity' || f.assetClass === 'International').reduce((s, f) => s + f.allocation, 0)
  if (eq >= 70) return { riskKey: 'aggressive', color: 'text-red-600' }
  if (eq >= 50) return { riskKey: 'growth', color: 'text-orange-600' }
  if (eq >= 30) return { riskKey: 'balanced', color: 'text-blue-600' }
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
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-1.5 px-2 rounded-lg hover:bg-blue-50" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
        <Plus className="w-3.5 h-3.5" /> {t('enrollment.investment.add_fund')}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-72 max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([cls, funds]) => (
            <div key={cls}>
              <p className="px-3 pt-2.5 pb-1 text-gray-400 sticky top-0 bg-white dark:bg-gray-800" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cls}</p>
              {funds.map((fund) => (
                <button type="button" key={fund.ticker} onClick={() => { onAdd({ ...fund, allocation: 0 }); setOpen(false) }} className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-gray-800 dark:text-white" style={{ fontSize: '0.8rem' }}>{fund.name}</p>
                    <p className="text-gray-400" style={{ fontSize: '0.68rem' }}>{fund.ticker} · {t('enrollment.investment.er')} {fund.expense}</p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
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
            <p className="text-gray-400" style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{assetClass}</p>
          </div>
          <div className="space-y-2">
            {classFunds.map((fund) => (
              <div key={fund.ticker} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-gray-900 dark:text-white truncate" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{fund.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-gray-400" style={{ fontSize: '0.68rem' }}>{fund.ticker}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400" style={{ fontSize: '0.68rem' }}>{t('enrollment.investment.er')} {fund.expense}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button type="button" onClick={() => onUpdate(fund.ticker, Math.max(0, fund.allocation - 1))} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"><Minus className="w-3 h-3" /></button>
                    <div className="flex items-center gap-0.5 bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-0.5">
                      <input type="number" min={0} max={100} value={fund.allocation} onChange={(e) => onUpdate(fund.ticker, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} className="w-9 text-right bg-transparent border-none outline-none text-gray-900 dark:text-white tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 600 }} />
                      <span className="text-gray-400" style={{ fontSize: '0.78rem' }}>%</span>
                    </div>
                    <button type="button" onClick={() => onUpdate(fund.ticker, Math.min(100, fund.allocation + 1))} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"><Plus className="w-3 h-3" /></button>
                    <button type="button" onClick={() => onRemove(fund.ticker)} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <input type="range" min={0} max={100} value={fund.allocation} onChange={(e) => onUpdate(fund.ticker, parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${fund.color} 0%, ${fund.color} ${fund.allocation}%, var(--slider-track) ${fund.allocation}%, var(--slider-track) 100%)`, accentColor: fund.color }} />
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
        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
          <div className="w-14 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={16} outerRadius={26} paddingAngle={2} dataKey="value" strokeWidth={0}>{chartData.map((e) => <Cell key={e.name} fill={e.color} />)}</Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-x-4 gap-y-1">{chartData.map((d) => <div key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} /><span className="text-gray-600" style={{ fontSize: '0.72rem' }}>{d.name}: <span className="text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>{d.value}%</span></span></div>)}</div>
            <div className="flex items-center gap-1.5 mt-1.5"><Gauge className="w-3 h-3 text-gray-400" /><span className="text-gray-500" style={{ fontSize: '0.68rem' }}>{t('enrollment.investment.risk_label')} <span className={riskColor} style={{ fontWeight: 600 }}>{riskShort}</span></span></div>
          </div>
        </div>
      )}
      <div>
        {allocs.unified.length === 0
          ? <div className="text-center py-8"><p className="text-gray-400" style={{ fontSize: '0.85rem' }}>{t('enrollment.investment.no_funds')}</p><div className="mt-3 flex justify-center"><FundPicker existingTickers={[]} onAdd={addUnifiedFund} /></div></div>
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
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose() }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div><h2 className="text-gray-900 dark:text-white" style={{ fontSize: '1.1rem' }}>{t('enrollment.investment.modal_edit_title')}</h2><p className="text-gray-400 mt-0.5" style={{ fontSize: '0.78rem' }}>{t('enrollment.investment.modal_edit_sub')}</p></div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PortfolioEditorContent allocs={allocs} setAllocs={setAllocs as React.Dispatch<React.SetStateAction<PerSourceAllocations | null>>} />
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setAllocs(initialAllocations)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors px-3 py-2" style={{ fontSize: '0.82rem', fontWeight: 500 }}><RotateCcw className="w-3.5 h-3.5" /> {t('enrollment.investment.reset')}</button>
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t('enrollment.investment.cancel')}</button>
            <button type="button" onClick={() => { if (allValid) onSave(allocs) }} disabled={!allValid} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${allValid ? 'btn-brand text-white active:scale-[0.98]' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`} style={{ fontSize: '0.85rem', fontWeight: 500 }}><Check className="w-4 h-4" /> {t('enrollment.investment.save_portfolio')}</button>
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
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm overflow-hidden ${sourceBorderColors[sourceKey]}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sourceColors[sourceKey] }} /><p className="text-gray-900 dark:text-white" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t(`enrollment.investment.${sourceTKey[sourceKey]}`)}</p><span className={`${sourceBgColors[sourceKey]} px-1.5 py-0.5 rounded`} style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.03em', color: sourceColors[sourceKey] }}>{t(`enrollment.investment.${sourceTaxTKey[sourceKey]}`)}</span></div>
            <div className="flex items-center gap-3 mt-1.5"><span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.82rem', fontWeight: 500 }}>${Math.round(monthlyAmount).toLocaleString(locale)}/mo</span><span className="text-gray-300">·</span><span className="text-gray-500" style={{ fontSize: '0.78rem' }}>{activeFunds.length} {activeFunds.length === 1 ? t('enrollment.investment.funds_one') : t('enrollment.investment.funds_other')}</span>{isCustomized && <><span className="text-gray-300">·</span><span className="text-blue-600" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{t('enrollment.investment.customized')}</span></>}</div>
          </div>
          <button type="button" onClick={onEditPortfolio} className="shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors" style={{ fontSize: '0.82rem', fontWeight: 500 }}><Pencil className="w-3.5 h-3.5 inline mr-1.5" />{t('enrollment.investment.edit')}</button>
        </div>
        {assetSummary.length > 0 && (
          <div className="mt-3">
            <div className="flex rounded-full h-2 overflow-hidden">{assetSummary.map((a) => <div key={a.name} style={{ width: `${a.value}%`, backgroundColor: a.color }} className="transition-all" />)}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">{assetSummary.map((a) => <div key={a.name} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} /><span className="text-gray-500" style={{ fontSize: '0.68rem' }}>{a.name} <span className="text-gray-700 dark:text-gray-300" style={{ fontWeight: 600 }}>{a.value}%</span></span></div>)}</div>
          </div>
        )}
        {activeFunds.length > 0 && (
          <div className="mt-2.5 space-y-0.5">
            {activeFunds.slice(0, 2).map((f) => <p key={f.ticker} className="text-gray-500 truncate" style={{ fontSize: '0.72rem' }}>{f.name}</p>)}
            {activeFunds.length > 2 && <p className="text-gray-400" style={{ fontSize: '0.68rem' }}>{t('enrollment.investment.more_funds', { n: activeFunds.length - 2 })}</p>}
          </div>
        )}
      </div>
      {activeFunds.length > 0 && (
        <>
          <button type="button" onClick={() => setExpanded(!expanded)} className="w-full border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{expanded ? t('enrollment.investment.hide_funds') : t('enrollment.investment.view_funds')}{expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
          {expanded && <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-2">{activeFunds.map((f) => <div key={f.ticker} className="flex items-center justify-between py-1"><div><p className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.78rem' }}>{f.name}</p><p className="text-gray-400" style={{ fontSize: '0.65rem' }}>{f.ticker} · {t('enrollment.investment.er')} {f.expense}</p></div><span className="text-gray-900 dark:text-white tabular-nums" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{f.allocation}%</span></div>)}</div>}
        </>
      )}
    </div>
  )
}

function InactiveSourceCard({ sourceKey }: { sourceKey: SourceKey }) {
  const { t } = useTranslation()
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 flex items-center gap-3 opacity-60">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sourceColors[sourceKey] }} />
      <div><p className="text-gray-500" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t(`enrollment.investment.${sourceTKey[sourceKey]}`)}</p><p className="text-gray-400" style={{ fontSize: '0.72rem' }}>{t('enrollment.investment.inactive')}</p></div>
    </div>
  )
}

/* ─── Main Component ─── */
function InvestmentStrategy() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData } = useEnrollment()
  const [showRiskEditor, setShowRiskEditor] = useState(false)
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [showBuildPortfolioModal, setShowBuildPortfolioModal] = useState(false)
  const [editingSource, setEditingSource] = useState<SourceKey | null>(null)
  const [modalInitialTab, setModalInitialTab] = useState<SourceKey>('preTax')
  const [customAllocations, setCustomAllocations] = useState<PerSourceAllocations | null>(null)
  const [hasConfirmedPlanDefault, setHasConfirmedPlanDefault] = useState(false)
  const [inlineAllocs, setInlineAllocs] = useState<PerSourceAllocations | null>(null)

  const currentAllocation = allocations[data.riskLevel] ?? allocations['balanced']
  const defaultFunds = buildFundsFromRecommended(currentAllocation)

  const activeSources: SourceKey[] = []
  if (data.contributionSources.roth > 0) activeSources.push('roth')
  if (data.contributionSources.preTax > 0) activeSources.push('preTax')
  if (data.supportsAfterTax && data.contributionSources.afterTax > 0) activeSources.push('afterTax')
  if (activeSources.length === 0) activeSources.push('preTax')

  const allSources: SourceKey[] = ['roth', 'preTax', 'afterTax']
  const inactiveSources = allSources.filter((s) => !activeSources.includes(s) && (s !== 'afterTax' || data.supportsAfterTax))

  const getFundsForSource = (src: SourceKey) => {
    if (!customAllocations) return defaultFunds
    if (customAllocations.sameForAll) return customAllocations.unified
    return customAllocations.sources[src]
  }
  const isSourceCustomized = () => !!customAllocations
  const monthlyTotal = (data.salary * data.contributionPercent) / 100 / 12
  const getMonthlyForSource = (src: SourceKey) => monthlyTotal * (data.contributionSources[src] / 100)

  const handleNext = useCallback(() => {
    updateData({ useRecommendedPortfolio: !customAllocations })
    navigate('/enrollment/readiness')
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
      sameForAll: activeSources.length === 1,
      unified: defaultFunds.map((f) => ({ ...f })),
      sources: { roth: defaultFunds.map((f) => ({ ...f })), preTax: defaultFunds.map((f) => ({ ...f })), afterTax: defaultFunds.map((f) => ({ ...f })) },
    }
    if (showBuildPortfolioModal) { setInlineAllocs(initial); setEditingSource(sourceKey) }
    else { setCustomAllocations(initial); setModalInitialTab(sourceKey); setShowCustomizeModal(true) }
  }

  const handleSaveCustom = (allocs: PerSourceAllocations) => { setCustomAllocations(allocs); setShowCustomizeModal(false) }
  const handleSaveInline = () => { if (inlineAllocs) setCustomAllocations(inlineAllocs); setEditingSource(null) }
  const handleCloseInline = () => { setEditingSource(null); setInlineAllocs(null) }

  const confirmPlanDefaultChoice = useCallback(() => {
    setHasConfirmedPlanDefault(true)
    updateData({ useRecommendedPortfolio: true })
  }, [updateData])

  const handleSelectPlanDefault = useCallback(() => {
    setCustomAllocations(null)
    setShowCustomizeModal(false)
    setShowBuildPortfolioModal(false)
    setEditingSource(null)
    setInlineAllocs(null)
    setHasConfirmedPlanDefault(true)
    updateData({ useRecommendedPortfolio: true })
  }, [updateData])

  return (
    <AnimatedPage>
      <div>
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t('enrollment.investment.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {t('enrollment.investment.subtitle')}
          </p>
        </div>

        <div className="space-y-5">
          {/* ── Investment Style Card ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('enrollment.investment.investment_style')}</p>
                  <p className="text-gray-900 dark:text-white" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t(`enrollment.investment.profile_${data.riskLevel}`)}</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5" style={{ fontSize: '0.78rem' }}>{t(`enrollment.investment.profile_desc_${data.riskLevel}`)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRiskEditor(!showRiskEditor)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors shrink-0" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                <Pencil className="w-3.5 h-3.5" /> {t('enrollment.investment.edit_strategy')}
              </button>
            </div>
            {showRiskEditor && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-4 gap-2.5">
                  {riskLevelKeys.map((levelKey) => (
                    <button type="button" key={levelKey} onClick={() => { updateData({ riskLevel: levelKey }); setShowRiskEditor(false); setCustomAllocations(null) }} className={`p-3 rounded-xl border-2 transition-all text-center ${data.riskLevel === levelKey ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'}`}>
                      <p className={data.riskLevel === levelKey ? 'text-blue-700' : 'text-gray-900 dark:text-white'} style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t(`enrollment.investment.level_${levelKey}`)}</p>
                      <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.72rem' }}>{t(`enrollment.investment.level_desc_${levelKey}`)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 60/40 Grid ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Plan Default Investment — 60% */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/40 rounded-md">
                      <p className="text-blue-700 dark:text-blue-400" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('enrollment.investment.recommended')}</p>
                    </div>
                  </div>
                  <h3 className="text-gray-900 dark:text-white" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('enrollment.investment.plan_default_title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1" style={{ fontSize: '0.8rem' }}>{t('enrollment.investment.plan_default_sub')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 space-y-1.5 shrink-0">
                  <div className="flex items-center gap-3"><span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>{t('enrollment.investment.return_label')}</span><span className="text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('enrollment.investment.return_value')}</span></div>
                  <div className="flex items-center gap-3"><span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>{t('enrollment.investment.risk_label')}</span>
                    <div className="flex items-center gap-1.5"><span className="text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('enrollment.investment.risk_low')}</span>
                      <div className="flex gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-gray-100" /><span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" /><span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" /><span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" /><span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" /></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.75rem' }}>{t('enrollment.investment.timeline_label')}</span><span className="text-gray-900 dark:text-white" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('enrollment.investment.timeline_value')}</span></div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="space-y-2.5">
                  {currentAllocation.map((a) => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} /><span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.8rem' }}>{a.name}</span></div>
                      <span className="text-gray-900 dark:text-white tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3">
                <p className="text-blue-900 dark:text-blue-300 mb-1" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('enrollment.investment.why_title')}</p>
                <p className="text-blue-800 dark:text-blue-400" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>{t('enrollment.investment.why_body')}</p>
              </div>
              <div className="mt-4">
                {customAllocations ? (
                  <button
                    type="button"
                    onClick={handleSelectPlanDefault}
                    className="btn-brand flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm active:scale-[0.98]"
                  >
                    {t('enrollment.investment.select_plan_default')}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                ) : !hasConfirmedPlanDefault ? (
                  <button
                    type="button"
                    onClick={confirmPlanDefaultChoice}
                    className="btn-brand flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm active:scale-[0.98]"
                  >
                    {t('enrollment.investment.select_plan_default')}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                ) : (
                  <div
                    className="btn-brand pointer-events-none flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm"
                    role="status"
                  >
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    {t('enrollment.investment.selected_plan_default')}
                  </div>
                )}
              </div>
            </div>

            {/* Customize Portfolio — 40% */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/20 dark:via-gray-900 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 border border-purple-200 dark:border-purple-800/40 rounded-md">
                  <p className="text-purple-700 dark:text-purple-400" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('enrollment.investment.advanced_user')}</p>
                </div>
              </div>
              <h3 className="text-gray-900 dark:text-white mb-2" style={{ fontSize: '1rem', fontWeight: 700 }}>{t('enrollment.investment.customize_title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>{t('enrollment.investment.customize_sub')}</p>
              <p className="text-gray-800 dark:text-gray-200 mb-4 flex-1" style={{ fontSize: '0.82rem', lineHeight: 1.5, fontWeight: 500 }}>{t('enrollment.investment.customize_for')}</p>
              {customAllocations ? (
                <div
                  className="pointer-events-none flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border-2 border-purple-500 bg-purple-50 py-2.5 px-6 text-purple-800 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-200"
                  role="status"
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  <Check className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" aria-hidden />
                  {t('enrollment.investment.selected_custom')}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBuildPortfolioModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-purple-300 py-2.5 px-6 text-purple-700 transition-all hover:border-purple-400 hover:bg-purple-50 active:scale-[0.98] dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950/30"
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {t('enrollment.investment.customize_cta')} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Advisor Card ── */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-sm p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="flex flex-col items-center gap-2">
                <div className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 rounded-md">
                  <p className="text-amber-700 dark:text-amber-400" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('enrollment.investment.expert_help')}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex w-full flex-1 flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6">
                <div>
                  <h3 className="text-gray-900 dark:text-white mb-2" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('enrollment.investment.advisor_title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{t('enrollment.investment.advisor_sub')}</p>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /><span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.75rem' }}>{t('enrollment.investment.advisor_b1')}</span></div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /><span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.75rem' }}>{t('enrollment.investment.advisor_b2')}</span></div>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-1 flex shrink-0 items-center gap-2 rounded-xl border-2 border-amber-500 py-2.5 px-6 text-amber-700 transition-all hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 sm:mt-4 sm:self-start"
                  style={{ fontSize: '0.85rem', fontWeight: 500 }}
                >
                  {t('enrollment.investment.connect_now')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                    <h2 className="text-gray-900 dark:text-white" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('enrollment.investment.build_modal_title')}</h2>
                  </div>
                  <p className="text-gray-500" style={{ fontSize: '0.85rem' }}>{editingSource ? t('enrollment.investment.build_modal_sub_edit', { source: t(`enrollment.investment.${sourceTKey[editingSource]}`) }) : t('enrollment.investment.build_modal_sub_select')}</p>
                </div>
                <button type="button" onClick={() => { setShowBuildPortfolioModal(false); setEditingSource(null); setInlineAllocs(null) }} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className={`${editingSource ? 'md:w-2/5' : 'w-full'} border-r border-gray-200 dark:border-gray-700 overflow-y-auto px-6 py-5 transition-all`}>
                  <p className="text-gray-900 dark:text-white mb-4" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('enrollment.investment.sources_heading')}</p>
                  <div className="space-y-3">
                    {activeSources.map((src) => <SourceCard key={src} sourceKey={src} monthlyAmount={getMonthlyForSource(src)} funds={getFundsForSource(src)} isCustomized={isSourceCustomized()} onEditPortfolio={() => handleOpenCustomize(src)} />)}
                    {inactiveSources.map((src) => <InactiveSourceCard key={src} sourceKey={src} />)}
                  </div>
                </div>
                {editingSource && inlineAllocs && (
                  <div className="flex-1 flex flex-col md:w-3/5 bg-gray-50 dark:bg-gray-800">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sourceColors[editingSource] }} /><h3 className="text-gray-900 dark:text-white" style={{ fontSize: '1rem', fontWeight: 600 }}>{t('enrollment.investment.customize_source', { source: t(`enrollment.investment.${sourceTKey[editingSource]}`) })}</h3></div>
                        <button type="button" onClick={handleCloseInline} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      <PortfolioEditorContent allocs={inlineAllocs} setAllocs={setInlineAllocs} />
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={handleCloseInline} className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t('enrollment.investment.cancel')}</button>
                        <button type="button" onClick={handleSaveInline} className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 transition-all" style={{ fontSize: '0.85rem', fontWeight: 500 }}><Check className="w-4 h-4" /> {t('enrollment.investment.save_changes')}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button type="button" onClick={() => { setShowBuildPortfolioModal(false); setEditingSource(null); setInlineAllocs(null) }} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 px-6 transition-all" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('enrollment.investment.done')} <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}

export default InvestmentStrategy
