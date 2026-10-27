import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { ARTICLES, FEATURED_PATH, TOPICS, type Topic } from './articles'

function ArticleView({ id }: { id: string }) {
  const { t } = useTranslation()
  const article = ARTICLES.find((a) => a.id === id)
  if (!article) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-gray-600 dark:text-gray-300">{t('enrich.empty')}</p>
        <Link to="/enrich" className="mt-3 inline-block font-semibold text-blue-600 hover:underline">{t('enrich.back')}</Link>
      </div>
    )
  }
  const body = t(`enrich.articles.${id}.body`, { returnObjects: true }) as unknown as string[]
  const pathIdx = FEATURED_PATH.indexOf(id)
  const prev = pathIdx > 0 ? FEATURED_PATH[pathIdx - 1] : null
  const next = pathIdx >= 0 && pathIdx < FEATURED_PATH.length - 1 ? FEATURED_PATH[pathIdx + 1] : null

  return (
    <AnimatedPage>
      <article className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <Link to="/enrich" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t('enrich.back')}
        </Link>
        {pathIdx >= 0 && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">{t('enrich.part_of', { n: pathIdx + 1, total: FEATURED_PATH.length, title: t('enrich.path_title') })}</p>}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t(`enrich.topic_${article.topic}`)} · {t('enrich.min_read', { count: article.minutes })}</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 dark:text-white">{t(`enrich.articles.${id}.title`)}</h1>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-gray-700 dark:text-gray-200">
          {Array.isArray(body) && body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">{t('enrich.educational')}</p>
        {(prev || next) && (
          <nav className="mt-6 flex justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800" aria-label={t('enrich.featured')}>
            {prev ? <Link to={`/enrich/${prev}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"><ArrowLeft className="h-4 w-4" aria-hidden />{t('enrich.previous')}</Link> : <span />}
            {next && <Link to={`/enrich/${next}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">{t('enrich.next')}<ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          </nav>
        )}
      </article>
    </AnimatedPage>
  )
}

export default function EnrichPage() {
  const { t } = useTranslation()
  const { articleId } = useParams()
  const [topic, setTopic] = useState<Topic | 'all'>('all')

  if (articleId) return <ArticleView id={articleId} />

  const list = ARTICLES.filter((a) => topic === 'all' || a.topic === topic)
  const pathMinutes = FEATURED_PATH.reduce((s, id) => s + (ARTICLES.find((a) => a.id === id)?.minutes ?? 0), 0)

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{t('enrich.title')}</p>
        <h1 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">{t('enrich.subtitle')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{t('enrich.intro')}</p>

        <section aria-labelledby="featured-heading" className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-6">
          <p id="featured-heading" className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{t('enrich.featured')}</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{t('enrich.path_title')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-300">{t('enrich.path_desc')}</p>
          <p className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden />{t('enrich.path_articles', { count: FEATURED_PATH.length })}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{t('enrich.path_minutes', { count: pathMinutes })}</span>
          </p>
          <Link to={`/enrich/${FEATURED_PATH[0]}`} className="btn-brand mt-4 inline-block rounded-lg px-5 py-2 text-sm font-semibold">{t('enrich.start_path')}</Link>
        </section>

        <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-900 dark:text-white">{t('enrich.browse')}</h2>
        <div role="tablist" aria-label={t('enrich.browse')} className="mb-4 flex flex-wrap gap-1.5">
          {(['all', ...TOPICS] as const).map((id) => (
            <button key={id} type="button" role="tab" aria-selected={topic === id} onClick={() => setTopic(id)} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', topic === id ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800')}>
              {t(`enrich.topic_${id}`)}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">{t('enrich.empty')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {list.map((a) => (
              <li key={a.id}>
                <Link to={`/enrich/${a.id}`} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t(`enrich.topic_${a.topic}`)}</span>
                  <span className="mt-1 text-base font-bold text-gray-900 dark:text-white">{t(`enrich.articles.${a.id}.title`)}</span>
                  <span className="mt-1 flex-1 text-sm text-gray-600 dark:text-gray-300">{t(`enrich.articles.${a.id}.summary`)}</span>
                  <span className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{t('enrich.min_read', { count: a.minutes })}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">{t('enrich.read')} <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AnimatedPage>
  )
}
