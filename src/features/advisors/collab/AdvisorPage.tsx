import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { ASSIGNED_ADVISER, RECOMMENDATIONS } from './adviser'
import { useAdviser } from './useAdviser'
import { MessagesPanel } from './MessagesPanel'
import { MeetingsPanel } from './MeetingsPanel'
import { RecommendationsPanel } from './RecommendationsPanel'
import { SharingCard } from './SharingCard'

type Tab = 'messages' | 'meetings' | 'recs'
const TABS: Tab[] = ['messages', 'meetings', 'recs']

export default function AdvisorPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { unread, nextMeeting, doneRecs } = useAdviser()

  const requested = params.get('tab')
  const tab: Tab = TABS.includes(requested as Tab) ? (requested as Tab) : 'messages'
  const badge: Partial<Record<Tab, number>> = { messages: unread.length, recs: RECOMMENDATIONS.length - doneRecs.length }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-surface-page">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="pb-5">
            <h1 className="text-[28px] font-bold leading-tight text-text-primary">{t('adviser.title')}</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-text-secondary">{t('adviser.subtitle')}</p>
          </header>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="rounded-[12px] border border-border-default bg-surface-card shadow-card">
                <div role="tablist" aria-label={t('adviser.title')} className="flex gap-1 border-b border-border-default px-3 pt-3">
                  {TABS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      id={`adviser-tab-${id}`}
                      aria-selected={tab === id}
                      aria-controls="adviser-panel"
                      onClick={() => setParams({ tab: id }, { replace: true })}
                      className={cn(
                        '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
                        tab === id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {t(`adviser.tab_${id}`)}
                      {!!badge[id] && (
                        <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-bold leading-4 text-text-inverse">{badge[id]}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div id="adviser-panel" role="tabpanel" aria-labelledby={`adviser-tab-${tab}`} className="p-4 sm:p-5">
                  {tab === 'messages' && <MessagesPanel />}
                  {tab === 'meetings' && <MeetingsPanel />}
                  {tab === 'recs' && <RecommendationsPanel />}
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-5 lg:col-span-4">
              <div className="rounded-[12px] border border-border-default bg-surface-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-text-inverse" aria-hidden>
                    {ASSIGNED_ADVISER.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t('adviser.your_adviser')}</p>
                    <p className="truncate text-[16px] font-bold text-text-primary">{ASSIGNED_ADVISER.name}</p>
                    <p className="text-[12px] text-text-secondary">{t('postDashboard.advisor_title_role')}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 divide-x divide-border-default text-center">
                  <div className="px-1">
                    <p className="flex items-center justify-center gap-1 text-[15px] font-bold text-text-primary">
                      {ASSIGNED_ADVISER.rating}
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    </p>
                    <p className="text-[11px] text-text-muted">{t('postDashboard.advisor_rating')}</p>
                  </div>
                  <div className="px-1">
                    <p className="text-[15px] font-bold text-text-primary">{ASSIGNED_ADVISER.yearsExperience}yr</p>
                    <p className="text-[11px] text-text-muted">{t('postDashboard.advisor_experience')}</p>
                  </div>
                  <div className="px-1">
                    <p className="text-[15px] font-bold text-text-primary">{ASSIGNED_ADVISER.clients}</p>
                    <p className="text-[11px] text-text-muted">{t('postDashboard.advisor_clients')}</p>
                  </div>
                </div>
                {nextMeeting && (
                  <p className="mt-4 rounded-lg bg-status-info-bg px-3 py-2 text-[12px] font-medium text-text-primary">
                    {t('adviser.next_meeting', {
                      when: new Date(nextMeeting.at).toLocaleString(getAppDateLocale(), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                    })}
                  </p>
                )}
              </div>
              <SharingCard />
            </aside>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
