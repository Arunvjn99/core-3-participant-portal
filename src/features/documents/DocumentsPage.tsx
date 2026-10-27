import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Download, FileText, Search } from 'lucide-react'
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
  const field = 'h-10 w-full rounded-md border border-border-default bg-surface-card px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus'

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-surface-page">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="pb-5">
            <h1 className="text-[28px] font-bold leading-tight text-text-primary">{t('documents.title')}</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{t('documents.subtitle')}</p>
          </header>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (dateInvalid) return
              setApplied(draft)
              setTypesOpen(false)
            }}
            className="mb-5 rounded-[12px] border border-border-default bg-surface-card p-4 shadow-card"
            aria-label={t('documents.filters.title')}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block lg:col-span-1">
                <span className="mb-1 block text-xs font-medium text-text-secondary">{t('documents.filters.search')}</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('documents.filters.name_placeholder')} className={cn(field, 'pl-9')} />
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">{t('documents.filters.plan')}</span>
                <select value={draft.planId} onChange={(e) => setDraft({ ...draft, planId: e.target.value })} className={field}>
                  <option value="">{t('documents.filters.all')}</option>
                  {DOC_PLANS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.planId})</option>
                  ))}
                </select>
              </label>
              <div className="relative">
                <span className="mb-1 block text-xs font-medium text-text-secondary" id="doc-type-label">{t('documents.filters.type')}</span>
                <button type="button" aria-haspopup="true" aria-expanded={typesOpen} aria-labelledby="doc-type-label" onClick={() => setTypesOpen((o) => !o)} className={cn(field, 'flex items-center justify-between text-left')}>
                  <span className="truncate">{draft.types.length === 0 ? t('documents.filters.all') : t('documents.filters.n_selected', { count: draft.types.length })}</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden />
                </button>
                {typesOpen && (
                  <fieldset className="absolute z-20 mt-1 max-h-72 w-72 max-w-[90vw] overflow-y-auto rounded-md border border-border-default bg-surface-card p-2 shadow-dropdown">
                    <legend className="sr-only">{t('documents.filters.type')}</legend>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-elevated">
                      <input type="checkbox" checked={allTypes} onChange={() => setDraft((d) => ({ ...d, types: allTypes ? [] : [...DOC_TYPES] }))} className="h-4 w-4 rounded accent-blue-600" />
                      {t('documents.filters.select_all')}
                    </label>
                    {DOC_TYPES.map((ty) => (
                      <label key={ty} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-text-primary hover:bg-surface-elevated">
                        <input type="checkbox" checked={draft.types.includes(ty)} onChange={() => toggleType(ty)} className="h-4 w-4 rounded accent-blue-600" />
                        {t(`documents.type.${ty}`)}
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">{t('documents.filters.from')}</span>
                <input type="date" value={draft.from} max={draft.to} onChange={(e) => setDraft({ ...draft, from: e.target.value })} aria-invalid={dateInvalid ? true : undefined} className={field} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">{t('documents.filters.to')}</span>
                <input type="date" value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} aria-invalid={dateInvalid ? true : undefined} className={field} />
              </label>
            </div>
            {dateInvalid && <p role="alert" className="mt-2 text-xs text-status-danger">{t('documents.filters.err_dates')}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={reset} className="text-sm font-semibold text-primary hover:underline">{t('documents.filters.reset')}</button>
              <button type="submit" disabled={dateInvalid} className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50">{t('documents.filters.apply')}</button>
            </div>
          </form>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="tablist" aria-label={t('documents.title')} className="flex flex-wrap gap-1.5">
              {tabs.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={category === id}
                  onClick={() => setCategory(id)}
                  className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors', category === id ? 'border-primary bg-primary text-text-inverse' : 'border-border-default bg-surface-card text-text-secondary hover:bg-surface-elevated')}
                >
                  {t(id === 'all' ? 'documents.category.all' : `documents.category.${id}`)}
                  <span className={cn('ml-1.5 text-[11px]', category === id ? 'opacity-80' : 'text-text-muted')}>{counts[id]}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <p role="status" className="text-sm font-medium text-text-secondary">{t('documents.filters.records', { count: visible.length })}</p>
              <button type="button" onClick={() => setGenerating(true)} className="rounded-md border border-primary px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">{t('documents.generate.open')}</button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-[12px] border border-border-default bg-surface-card py-12 text-center text-sm text-text-muted">{t('documents.empty')}</p>
          ) : (
            <ul className="divide-y divide-border-default overflow-hidden rounded-[12px] border border-border-default bg-surface-card shadow-card">
              {visible.map((r) => (
                <li key={r.doc.id} className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-status-info-bg text-primary">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-text-primary">{r.text.title}</p>
                      {r.isNew && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-inverse">{t('documents.new')}</span>}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-text-secondary">{r.text.description}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{t(`documents.type.${r.doc.type}`)} · {fmt(r.doc.at)}</p>
                  </div>
                  <button type="button" onClick={() => handleDownload(r)} aria-label={`${t('documents.download')}: ${r.text.title}`} className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-default px-3 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-elevated">
                    <Download className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{t('documents.download')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-center text-[13px] text-text-secondary">
            {t('documents.cant_find')}{' '}
            <Link to="/service-requests?new=1&category=document" className="font-semibold text-primary hover:underline">{t('documents.request_link')}</Link>
          </p>
        </div>
      </div>
      <GenerateStatementDialog open={generating} onClose={closeGenerate} defaultPlanId={applied.planId} />
    </AnimatedPage>
  )
}
