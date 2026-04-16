import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import AuthCarousel from './AuthCarousel'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/core/hooks/useTheme'
import { LEGAL } from '@/lib/constants'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'

interface AuthTwoPanelProps {
  children: ReactNode
}

export default function AuthTwoPanel({ children }: AuthTwoPanelProps) {
  const { t } = useTranslation()
  const { resolvedMode, setMode } = useTheme()
  const toggleTheme = () => setMode(resolvedMode === 'dark' ? 'light' : 'dark')

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* LEFT PANEL — 40% — hidden on mobile */}
      <div className="hidden md:block md:w-[40%] shrink-0 overflow-hidden">
        <AuthCarousel />
      </div>

      {/* RIGHT PANEL — 60% */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950 relative">
        {/* Dark mode toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* CORE Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1 mb-2">
                <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tight">C</span>
                <div className="relative">
                  <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tight">O</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-red-500" />
                  </div>
                </div>
                <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tight">RE</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Retirement Intelligence Platform</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">by Congruent Solutions</p>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              {children}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                © Congruent Solutions, Inc. All Rights Reserved
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-blue-600 dark:text-blue-400">
                <LegalHrefLink href={LEGAL.privacyPolicyHref} className="hover:underline">
                  {t('footer.privacy')}
                </LegalHrefLink>
                <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                  ·
                </span>
                <LegalHrefLink href={LEGAL.termsOfServiceHref} className="hover:underline">
                  {t('footer.terms')}
                </LegalHrefLink>
                <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                  ·
                </span>
                <LegalHrefLink href={LEGAL.helpCenterHref} className="hover:underline">
                  {t('footer.help')}
                </LegalHrefLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
