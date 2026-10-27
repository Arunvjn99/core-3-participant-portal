import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Plus } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { CATEGORIES, type ServiceCategory } from './serviceCatalog'
import { NewRequestForm } from './NewRequestForm'
import { RequestCard } from './RequestCard'
import { useServiceRequests } from './useServiceRequests'

export default function ServiceRequestsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const rows = useServiceRequests()
  const [created, setCreated] = useState<string | null>(null)

  const showForm = params.get('new') === '1'
  const requested = params.get('category')
  const initialCategory = CATEGORIES.find((c) => c.id === requested)?.id as ServiceCategory | undefined

  const openForm = () => {
    setCreated(null)
    setParams({ new: '1' }, { replace: true })
  }
  const closeForm = () => setParams({}, { replace: true })

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-surface-page">
        <div className="mx-auto max-w-[860px] px-4 py-6 sm:px-6 lg:py-8">
          <header className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-text-primary">{t('support.title')}</h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text-secondary">{t('support.subtitle')}</p>
            </div>
            {!showForm && (
              <button type="button" onClick={openForm} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-medium text-text-inverse transition-colors hover:bg-primary-hover">
                <Plus className="h-4 w-4" aria-hidden />
                {t('support.new')}
              </button>
            )}
          </header>

          {created && !showForm && (
            <p role="status" className="mb-4 flex items-start gap-2 rounded-lg bg-status-success-bg px-3.5 py-3 text-[13px] text-text-primary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" aria-hidden />
              {t('support.created', { ref: created })}
            </p>
          )}

          {showForm && (
            <div className="mb-5">
              <NewRequestForm
                initialCategory={initialCategory}
                onCancel={closeForm}
                onCreated={(req) => {
                  setCreated(req.ref)
                  closeForm()
                }}
              />
            </div>
          )}

          {rows.length === 0 ? (
            <p className="rounded-[12px] border border-border-default bg-surface-card py-12 text-center text-sm text-text-muted">{t('support.empty')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map(({ req, timeline, status }, i) => (
                <RequestCard
                  key={req.ref === created ? `${req.id}:new` : req.id}
                  req={req}
                  timeline={timeline}
                  status={status}
                  defaultOpen={req.ref === created || (i === 0 && !showForm)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}
