import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronDown, LifeBuoy, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAIStore } from '@/core/store/aiStore'
import { getFAQById } from '@/features/ai/services/faqAnswers'
import {
  BODY_TEXT, Card, CARD_TITLE, DIVIDE, HEADING, IconChip, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, RULE, StepHeader, TEXT_LINK, TitleBadge, card, chip,
} from '@/features/enrollment/enrollmentUi'
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqCategoryId } from './faqCatalog'

const SUPPORT_EMAIL = 'support@congruentsolutions.com'

/** Lower case, no accents, no bold markers: "Jubilación" matches "jubilacion". */
const fold = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\*\*/g, '')

/** Answers mark emphasis as **bold**, the same convention the Core AI answers use. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 === 1 ? <strong key={i} className={cn('font-semibold', HEADING)}>{part}</strong> : part,
      )}
    </>
  )
}

export default function HelpCenterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const openChat = useAIStore((s) => s.openChat)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FaqCategoryId | 'all'>('all')
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set())

  const entries = useMemo(
    () =>
      FAQ_ITEMS.map((item) => {
        // Shared items fall back to the Core AI copy, which is the English text
        const source = item.shared ? getFAQById(item.id) : undefined
        const question = t(`faq.items.${item.id}.q`, { defaultValue: source?.question ?? '' })
        const answer = t(`faq.items.${item.id}.a`, { defaultValue: source?.fullAnswer ?? '' })
        return { ...item, question, answer, haystack: fold(`${question} ${answer}`) }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  )

  const words = fold(query).split(/\s+/).filter(Boolean)
  const searching = words.length > 0
  const matches = entries.filter((e) => words.every((w) => e.haystack.includes(w)))
  const groups = FAQ_CATEGORIES.map((c) => ({ ...c, items: matches.filter((e) => e.category === c.id) })).filter(
    (g) => g.items.length > 0 && (category === 'all' || g.id === category),
  )
  const shown = groups.reduce((n, g) => n + g.items.length, 0)

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <div className="min-h-screen bg-surface-page">
      <div className={cn('border-b bg-surface-card', RULE)}>
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3.5 sm:px-6">
          <button type="button" onClick={() => navigate(-1)} className={cn(TEXT_LINK, 'gap-1.5 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400')}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {t('legal.back')}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-28 pt-8 sm:px-6">
        <StepHeader title={t('faq.title')} subtitle={t('faq.subtitle')} />

        <div>
          <label htmlFor="faq-search" className="sr-only">{t('faq.search_label')}</label>
          <div className="relative">
            <Search className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', MUTED_TEXT)} aria-hidden />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                // A search looks through every topic
                setCategory('all')
              }}
              placeholder={t('faq.search_placeholder')}
              autoComplete="off"
              className="h-12 w-full rounded-full bg-white pl-11 pr-4 text-[15px] text-slate-900 shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400"
            />
          </div>

          <div role="group" aria-label={t('faq.topics_label')} className="mt-3 flex flex-wrap gap-2">
            {(['all', ...FAQ_CATEGORIES.map((c) => c.id)] as const).map((id) => (
              <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)} className={chip(category === id)}>
                {t(id === 'all' ? 'faq.all_topics' : `faq.category.${id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Announced as the list narrows; only shown while searching */}
        <p role="status" className={cn('text-[13px]', MUTED_TEXT, !searching && 'sr-only')}>
          {searching ? t('faq.results', { count: shown, query: query.trim() }) : ''}
        </p>

        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`faq-${group.id}`} className={card()}>
            <div className="flex items-center gap-2.5">
              <IconChip Icon={group.Icon} small />
              <h2 id={`faq-${group.id}`} className={CARD_TITLE}>{t(`faq.category.${group.id}`)}</h2>
            </div>
            <ul className={cn('mt-3 divide-y border-t', DIVIDE, RULE)}>
              {group.items.map((item) => {
                const open = openIds.has(item.id)
                return (
                  <li key={item.id}>
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${item.id}`}
                        aria-expanded={open}
                        aria-controls={`faq-a-${item.id}`}
                        onClick={() => toggle(item.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-4 rounded-lg py-3.5 text-left text-[15px] font-semibold leading-snug transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:hover:text-blue-300',
                          HEADING,
                        )}
                      >
                        <span className="min-w-0">{item.question}</span>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none', MUTED_TEXT, open && 'rotate-180')} aria-hidden />
                      </button>
                    </h3>
                    <div
                      id={`faq-a-${item.id}`}
                      role="region"
                      aria-labelledby={`faq-q-${item.id}`}
                      hidden={!open}
                      className={cn('pb-4 pr-2 text-sm leading-relaxed sm:pr-8', BODY_TEXT)}
                    >
                      <Rich text={item.answer} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {groups.length === 0 && (
          <Card className="text-center">
            <p className={cn('text-[15px] font-semibold', HEADING)}>{t('faq.no_results_title')}</p>
            <p className={cn('mx-auto mt-1 max-w-md text-sm', BODY_TEXT)}>{t('faq.no_results_body')}</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
              className={cn(TEXT_LINK, 'mt-3 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400')}
            >
              {t('faq.clear_search')}
            </button>
          </Card>
        )}

        <Card tone="sky" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <TitleBadge Icon={LifeBuoy} />
            <div className="min-w-0">
              <h2 className={CARD_TITLE}>{t('faq.help_title')}</h2>
              <p className={cn('mt-1 text-sm leading-relaxed', BODY_TEXT)}>
                {t('faq.help_body')}{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className={cn(TEXT_LINK, 'break-all')}>{SUPPORT_EMAIL}</a>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link to="/service-requests?new=1" className={cn(PILL_SECONDARY, 'flex-auto whitespace-nowrap')}>{t('faq.help_request')}</Link>
            <button type="button" onClick={openChat} className={cn(PILL_PRIMARY, 'flex-auto whitespace-nowrap')}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('faq.help_ai')}
            </button>
          </div>
        </Card>
      </main>
    </div>
  )
}
