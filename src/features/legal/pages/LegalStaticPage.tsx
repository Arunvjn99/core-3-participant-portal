import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type LegalPageKind = 'privacy' | 'terms' | 'help'

function LegalStaticPage({ kind }: { kind: LegalPageKind }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-page text-text-primary">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {t('legal.back')}
          </button>
        </div>
      </div>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(`legal.${kind}_title`)}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('legal.last_updated')}</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>{t(`legal.${kind}_p1`)}</p>
          <p>{t(`legal.${kind}_p2`)}</p>
          {kind === 'privacy' && <p>{t('legal.privacy_p3')}</p>}
          {kind === 'terms' && <p>{t('legal.terms_p3')}</p>}
          {kind === 'help' && (
            <p>
              <a href="mailto:support@congruentsolutions.com" className="font-medium text-primary hover:underline">
                support@congruentsolutions.com
              </a>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export function PrivacyPolicyPage() {
  return <LegalStaticPage kind="privacy" />
}

export function TermsOfServicePage() {
  return <LegalStaticPage kind="terms" />
}

export function HelpCenterPage() {
  return <LegalStaticPage kind="help" />
}
