import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

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
    <div className="sticky bottom-0 z-10 mt-8 w-full border-t border-gray-200 bg-[#f5f7fa]/95 px-3 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95 sm:px-6">
      {/* Single row: avoid two equal flex-1 columns (that parked Next mid-bar). Back left; Next flush right via ml-auto. */}
      <div className="mx-auto flex min-h-[48px] w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
        {showBack && config.onBack && (
          <button
            type="button"
            onClick={config.onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <span aria-hidden className="text-base leading-none">
              ←
            </span>
            {t('enrollment.back')}
          </button>
        )}
        {showNext && config.onNext && (
          <div
            className={
              showBack
                ? 'flex w-full justify-end sm:ml-auto sm:w-auto sm:justify-end'
                : 'flex w-full justify-end'
            }
          >
            <button
              type="button"
              onClick={config.onNext}
              disabled={nextDisabled}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[132px]"
              style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
            >
              {label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
