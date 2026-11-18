import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Download, FileText, Plus, Search } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { DOC_CATEGORIES, DOC_PLANS, DOC_TYPES, type DocCategory, type DocType } from './buildDocuments'
import { GenerateStatementDialog } from './GenerateStatementDialog'
import { buildPdf, downloadBlob } from './pdf'
import { useDocumentState } from './documentState'
import { useDocuments } from './useDocuments'

type Category = DocCategory | 'all'

/** The pre-enrollment dashboard's pieces: card surface, pills, and one focus ring for every control */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'
const PILL_PRIMARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-[14px] font-semibold text-white shadow-[0_6px_14px_-8px_rgba(37,99,235,0.5)] transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] ${FOCUS}`
const PILL_SECONDARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-slate-900 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`
const LABEL = 'mb-1.5 block text-[13px] font-semibold text-text-primary'
/** How many documents show before "Show All" */
const FEW_DOCS = 4

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

interface Filters {
  planId: string
  types: DocType[]
  from: string
  to: string
}

export default function DocumentsPage() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const rows = useDocuments()
  const markOpened = useDocumentState((s) => s.markOpened)

  /** Default window covers the last two years so annual plan documents are visible. */
  const defaults = useMemo<Filters>(() => ({ planId: '', types: [], from: iso(new Date(now - 2 * 365 * 86_400_000)), to: iso(new Date(now)) }), [now])
  const [draft, setDraft] = useState<Filters>(defaults)
  const [applied, setApplied] = useState<Filters>(defaults)
  const [category, setCategory] = useState<Category>('all')
  const [query, setQuery] = useState('')
  const [typesOpen, setTypesOpen] = useState(false)
  const typesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!typesOpen) return
    const onDown = (e: MouseEvent) => {
      if (!typesRef.current?.contains(e.target as Node)) setTypesOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTypesOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [typesOpen])
  const [params, setParams] = useSearchParams()
  const [generating, setGenerating] = useState(params.get('generate') === '1')
  const closeGenerate = () => {
    setGenerating(false)
    if (params.has('generate')) setParams({}, { replace: true })
  }

  const fmt = (ms: number) => new Date(ms).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  const rendered = rows.map((r) => ({ ...r, text: r.doc.render(t) }))

  const q = query.trim().toLowerCase()
  const fromMs = new Date(`${applied.from}T00:00:00`).getTime()
  const toMs = new Date(`${applied.to}T23:59:59`).getTime()
  const filtered = rendered.filter(
    (r) =>
      (!applied.planId || r.doc.planId === applied.planId) &&
      (applied.types.length === 0 || applied.types.includes(r.doc.type)) &&
      r.doc.at >= fromMs &&
      r.doc.at <= toMs &&
      (!q || r.text.title.toLowerCase().includes(q) || r.text.description.toLowerCase().includes(q)),
  )

  const counts = useMemo(() => {
    const c: Record<Category, number> = { all: filtered.length, statements: 0, tax: 0, plan: 0, notices: 0 }
    for (const r of filtered) c[r.doc.category] += 1
    return c
  }, [filtered])
  const visible = filtered.filter((r) => category === 'all' || r.doc.category === category)
  /** The newest few fit on screen; the rest open on request. Changing a filter or tab goes back to the short list. */
  const listKey = `${category}|${query}|${JSON.stringify(applied)}`
  const [expandedFor, setExpandedFor] = useState<string | null>(null)
  const expanded = expandedFor === listKey
  const shown = expanded ? visible : visible.slice(0, FEW_DOCS)
  const hiddenCount = visible.length - shown.length

  const dateInvalid = draft.from > draft.to
  const toggleType = (ty: DocType) => setDraft((d) => ({ ...d, types: d.types.includes(ty) ? d.types.filter((x) => x !== ty) : [...d.types, ty] }))
  const allTypes = draft.types.length === DOC_TYPES.length
  const reset = () => {
    setDraft(defaults)
    setApplied(defaults)
    setQuery('')
    setCategory('all')
  }

  const handleDownload = (r: (typeof rendered)[number]) => {
    markOpened(r.doc.id)
    const blob = buildPdf(r.text.title, [
      r.text.description,
      `${t('documents.pdf.published')}: ${fmt(r.doc.at)}`,
      `${t('documents.pdf.category')}: ${t(`documents.category.${r.doc.category}`)}`,
      t('documents.pdf.sample'),
    ])
    downloadBlob(blob, `${r.doc.id.replace(/[^a-z0-9-]+/gi, '_')}.pdf`)
  }

  const tabs: Category[] = ['all', ...DOC_CATEGORIES]
  const field = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:ring-blue-400/30 dark:[color-scheme:dark]'

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6 lg:py-7">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('documents.title')}</h1>
              <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t('documents.subtitle')}</p>
            </div>
            <button type="button" onClick={() => setGenerating(true)} className={PILL_SECONDARY}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('documents.generate.open')}
            </button>
          </header>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (dateInvalid) return
              setApplied(draft)
              setTypesOpen(false)
            }}
            className={cn(CARD, 'mb-5 p-5')}
            aria-label={t('documents.filters.title')}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block lg:col-span-1">
                <span className={LABEL}>{t('documents.filters.search')}</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" aria-hidden />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('documents.filters.name_placeholder')} className={cn(field, 'pl-10')} />
                </span>
              </label>
              <label className="block">
                <span className={LABEL}>{t('documents.filters.plan')}</span>
                <select value={draft.planId} onChange={(e) => setDraft({ ...draft, planId: e.target.value })} className={field}>
                  <option value="">{t('documents.filters.all')}</option>
                  {DOC_PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.planId})</option>
                  ))}
                </select>
              </label>
              <div className="relative" ref={typesRef}>
                <span className={LABEL} id="doc-type-label">{t('documents.filters.type')}</span>
                <button type="button" aria-haspopup="true" aria-expanded={typesOpen} aria-labelledby="doc-type-label" onClick={() => setTypesOpen((o) => !o)} className={cn(field, 'flex items-center justify-between text-left')}>
                  <span className="truncate">{draft.types.length === 0 ? t('documents.filters.all') : t('documents.filters.n_selected', { count: draft.types.length })}</span>
                  <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform motion-reduce:transition-none dark:text-slate-400', typesOpen && 'rotate-180')} aria-hidden />
                </button>
                {typesOpen && (
                  <fieldset className="absolute z-20 mt-1.5 max-h-72 w-72 max-w-[90vw] overflow-y-auto rounded-2xl bg-surface-card p-2 shadow-[0_18px_40px_-16px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 dark:ring-white/15">
                    <legend className="sr-only">{t('documents.filters.type')}</legend>
                    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-semibold text-text-primary hover:bg-slate-50 dark:hover:bg-white/5">
                      <input type="checkbox" checked={allTypes} onChange={() => setDraft((d) => ({ ...d, types: allTypes ? [] : [...DOC_TYPES] }))} className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                      {t('documents.filters.select_all')}
                    </label>
                    {DOC_TYPES.map((ty) => (
                      <label key={ty} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-text-primary hover:bg-slate-50 dark:hover:bg-white/5">
                        <input type="checkbox" checked={draft.types.includes(ty)} onChange={() => toggleType(ty)} className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                        {t(`documents.type.${ty}`)}
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
              <label className="block">
                <span className={LABEL}>{t('documents.filters.from')}</span>
                <input type="date" value={draft.from} max={draft.to} onChange={(e) => setDraft({ ...draft, from: e.target.value })} aria-invalid={dateInvalid ? true : undefined} className={field} />
              </label>
              <label className="block">
                <span className={LABEL}>{t('documents.filters.to')}</span>
                <input type="date" value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} aria-invalid={dateInvalid ? true : undefined} className={field} />
              </label>
            </div>
            {dateInvalid && <p role="alert" className="mt-2 text-[12px] font-medium text-red-700 dark:text-red-300">{t('documents.filters.err_dates')}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
              <button type="button" onClick={reset} className={cn('min-h-10 rounded-md px-3 text-[14px] font-semibold text-primary hover:underline dark:text-blue-300', FOCUS)}>{t('documents.filters.reset')}</button>
              <button type="submit" disabled={dateInvalid} className={PILL_PRIMARY}>{t('documents.filters.apply')}</button>
            </div>
          </form>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label={t('documents.title')} className="flex flex-wrap gap-2">
              {tabs.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={category === id}
                  onClick={() => setCategory(id)}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                    FOCUS,
                    category === id
                      ? 'bg-[#0B1533] text-white dark:bg-white dark:text-[#0B1533]'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:ring-white/15 dark:hover:bg-white/10',
                  )}
                >
                  {t(id === 'all' ? 'documents.category.all' : `documents.category.${id}`)}
                  <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', category === id ? 'bg-white/20 dark:bg-[#0B1533]/10' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>{counts[id]}</span>
                </button>
              ))}
            </div>
            <p role="status" className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{t('documents.filters.records', { count: visible.length })}</p>
          </div>

          {visible.length === 0 ? (
            <div className={cn(CARD, 'flex flex-col items-center gap-3 px-6 py-14 text-center')}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                <FileText className="h-5 w-5 text-slate-500 dark:text-slate-300" aria-hidden />
              </span>
              <p className="text-[14px] text-slate-600 dark:text-slate-300">{t('documents.empty')}</p>
            </div>
          ) : (
            <ul className={cn(CARD, 'divide-y divide-slate-200/80 overflow-hidden dark:divide-white/10')}>
              {shown.map((r) => (
                <li key={r.doc.id} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-5 dark:hover:bg-white/[0.03]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold leading-snug text-text-primary">{r.text.title}</p>
                      {r.isNew && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-300" aria-hidden />
                          {t('documents.new')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-slate-600 dark:text-slate-300">{r.text.description}</p>
                    <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">{t(`documents.type.${r.doc.type}`)} · {fmt(r.doc.at)}</p>
                  </div>
                  <button type="button" onClick={() => handleDownload(r)} aria-label={`${t('documents.download')}: ${r.text.title}`} className={cn(PILL_SECONDARY, 'shrink-0 px-3 sm:px-4')}>
                    <Download className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{t('documents.download')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Left-aligned with the list, so the floating Ask CORE AI button (bottom centre) never covers it */}
          {visible.length > FEW_DOCS && (
            <div className="mt-3 flex justify-start">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedFor(expanded ? null : listKey)}
                className={PILL_SECONDARY}
              >
                {expanded ? (
                  <>
                    {t('documents.show_fewer')}
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  </>
                ) : (
                  <>
                    {t('documents.show_all', { count: visible.length })}
                    <span className="sr-only"> ({t('documents.more_hidden', { count: hiddenCount })})</span>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </div>
          )}

          <p className="mt-5 text-center text-[14px] text-slate-600 dark:text-slate-300">
            {t('documents.cant_find')}{' '}
            <Link to="/service-requests?new=1&category=document" className={cn('rounded font-semibold text-primary underline-offset-2 hover:underline dark:text-blue-300', FOCUS)}>{t('documents.request_link')}</Link>
          </p>
      </div>
      <GenerateStatementDialog open={generating} onClose={closeGenerate} defaultPlanId={applied.planId} />
    </AnimatedPage>
  )
}
