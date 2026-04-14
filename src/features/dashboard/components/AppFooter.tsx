import { useTranslation } from 'react-i18next'
import { useBrandTheme } from '@/core/theme/BrandThemeContext'

const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

export default function AppFooter() {
  const { t } = useTranslation()
  // useBrandTheme is available for any future brand-specific footer customisation
  void useBrandTheme()

  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* CORE logo + copyright */}
          <div className="flex items-center gap-3">
            <img
              src={CORE_LOGO}
              alt="CORE"
              className="h-6 opacity-70 transition-opacity hover:opacity-100"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {t('footer.copyright', { year })}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs font-medium text-gray-400 dark:text-gray-600">
            <a
              href="#"
              className="uppercase tracking-wide transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            >
              {t('footer.privacy')}
            </a>
            <a
              href="#"
              className="uppercase tracking-wide transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            >
              {t('footer.terms')}
            </a>
            <a
              href="#"
              className="uppercase tracking-wide transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            >
              {t('footer.help')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
