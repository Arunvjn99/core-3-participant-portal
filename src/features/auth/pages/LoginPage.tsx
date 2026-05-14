import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/core/supabase'
import { LEGAL, ROUTES } from '@/lib/constants'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import AuthLayout from '../components/AuthLayout'

const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const signupNotice = (location.state as { signupNotice?: string } | null)?.signupNotice
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) {
      // Demo mode — go to verify step
      navigate(ROUTES.VERIFY_OTP, { state: { email } })
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      console.error('[Login] signInWithPassword error:', signInError)
      setError(signInError.message)
      setLoading(false)
    } else {
      navigate(ROUTES.VERIFY_OTP, { state: { email } })
    }
  }

  return (
    <AuthLayout showLeftPanelLogo={false}>
      {/* ── Centered form area ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 px-8 py-8">

            {/* Logo */}
            <div className="mb-6">
              <img
                src={CORE_LOGO}
                alt="CORE"
                className="h-8 w-auto object-contain mb-2"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">
                {t('auth.platform_name')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('auth.platform_by')}
              </p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('auth.login')}</h1>

            {signupNotice ? (
              <div
                role="status"
                className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-100"
              >
                {signupNotice}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.enter_email')}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.enter_password')}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="brand-text text-sm font-medium hover:opacity-80"
                >
                  {t('auth.forgot_password')}
                </Link>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-brand w-full rounded-xl py-3 font-semibold text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('auth.signing_in')}
                  </span>
                ) : (
                  t('auth.login')
                )}
              </button>
            </form>

            {/* Sign up */}
            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('auth.no_account')}{' '}
              <Link to="/signup" className="brand-text font-semibold hover:underline">
                {t('auth.signup')}
              </Link>
            </p>

            {/* Help */}
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('auth.help_text')}{' '}
              <LegalHrefLink href={LEGAL.helpCenterHref} className="brand-text font-semibold hover:underline">
                {t('auth.help_center')}
              </LegalHrefLink>
            </p>
          </div>
        </div>
      </div>

      {/* ── Page footer — pinned to bottom ── */}
      <div className="px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          {t('auth.copyright')}
        </p>
        <div className="flex items-center gap-4">
          <LegalHrefLink
            href={LEGAL.privacyPolicyHref}
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
          >
            {t('auth.privacy_policy')}
          </LegalHrefLink>
          <img
            src={CORE_LOGO}
            alt="CORE"
            className="h-5 w-auto object-contain opacity-50"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
