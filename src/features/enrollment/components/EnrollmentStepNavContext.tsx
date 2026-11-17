import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PILL_PRIMARY, PILL_SECONDARY } from '../enrollmentUi'

export type EnrollmentPrimaryLabel = 'Continue' | 'Next' | 'Submit'

export interface EnrollmentNavConfig {
  onBack?: () => void
  onNext?: () => void
  /** @default true on most steps */
  showBack?: boolean
  /** @default true */
  showNext?: boolean
  primaryLabel?: EnrollmentPrimaryLabel
  nextDisabled?: boolean
}

type Ctx = {
  setStepNav: (config: EnrollmentNavConfig | null) => void
}

const EnrollmentStepNavContext = createContext<Ctx | null>(null)

export function EnrollmentStepNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<EnrollmentNavConfig | null>(null)

  const setStepNav = useCallback((config: EnrollmentNavConfig | null) => {
    setNav(config)
  }, [])

  const value = useMemo(() => ({ setStepNav }), [setStepNav])

  return (
    <EnrollmentStepNavContext.Provider value={value}>
      <>
        {children}
        <EnrollmentStepFooterBar config={nav} />
      </>
    </EnrollmentStepNavContext.Provider>
  )
}

export function useEnrollmentStepNav() {
  const ctx = useContext(EnrollmentStepNavContext)
  if (!ctx) {
    throw new Error('useEnrollmentStepNav must be used within EnrollmentStepNavProvider')
  }
  return ctx
}

function EnrollmentStepFooterBar({ config }: { config: EnrollmentNavConfig | null }) {
  const { t } = useTranslation()
  if (!config) return null

  const showBack = config.showBack !== false && Boolean(config.onBack)
  const showNext = config.showNext !== false && Boolean(config.onNext)
  const label =
    config.primaryLabel === 'Continue'
      ? t('common.continue')
      : config.primaryLabel === 'Submit'
        ? t('enrollment.submit')
        : t('enrollment.next')
  const nextDisabled = config.nextDisabled ?? false

  if (!showBack && !showNext) return null

  return (
    <div className="sticky bottom-0 z-10 mt-8 w-full border-t border-slate-200/80 bg-[color:color-mix(in_srgb,var(--surface-page)_92%,transparent)] px-4 py-3 backdrop-blur-sm dark:border-white/10 sm:px-6">
      {/* Back on the left, the primary action flush right */}
      <div className="mx-auto flex w-full max-w-[1040px] items-center gap-3">
        {showBack && config.onBack && (
          <button type="button" onClick={config.onBack} className={PILL_SECONDARY}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('enrollment.back')}
          </button>
        )}
        {showNext && config.onNext && (
          <button type="button" onClick={config.onNext} disabled={nextDisabled} className={cn(PILL_PRIMARY, 'ml-auto min-w-[132px]')}>
            {label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
