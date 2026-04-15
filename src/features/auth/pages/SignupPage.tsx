import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Check, X, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/core/supabase'
import { ROUTES } from '@/lib/constants'
import AuthLayout from '../components/AuthLayout'

const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password) && /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const tailwindColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const textColors = ['', '#dc2626', '#ca8a04', '#ca8a04', '#16a34a']
  return {
    checks,
    score,
    label: labels[score] || '',
    barColor: tailwindColors[score] || '',
    textColor: textColors[score] || '',
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string
  name: string
  logo_url: string | null
  primary_color: string | null
  slug: string
}

const FALLBACK_COMPANIES: Company[] = [
  { id: 'ascend', name: 'Ascend', slug: 'ascend', logo_url: null, primary_color: '#1e3a8a' },
  { id: 'congruent', name: 'Congruent Solutions', slug: 'congruent', logo_url: null, primary_color: '#7c3aed' },
  { id: 'lincoln', name: 'Lincoln Financial', slug: 'lincoln', logo_url: null, primary_color: '#6B1D4A' },
  { id: 'vanguard', name: 'Vanguard', slug: 'vanguard', logo_url: null, primary_color: '#811926' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'company' | 'form'>('company')
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    state: '',
    country: 'United States',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('companies')
      .select('id, name, slug, logo_url, primary_color')
      .then(({ data }) => { if (data?.length) setCompanies(data as Company[]) })
  }, [])

  const displayCompanies = companies.length > 0 ? companies : FALLBACK_COMPANIES
  const strength = getPasswordStrength(form.password)
  const primaryColor = selectedCompany?.primary_color || '#2563EB'

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    setStep('form')
  }

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (strength.score < 2) { setError('Please use a stronger password'); return }
    setError('')
    setLoading(true)

    if (!supabase) {
      // Demo mode
      navigate(ROUTES.DASHBOARD)
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: `${form.firstName} ${form.lastName}`,
          first_name: form.firstName,
          last_name: form.lastName,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user && selectedCompany) {
      const { error: userCompanyError } = await supabase.from('user_companies').insert({
        user_id: authData.user.id,
        company_id: selectedCompany.id,
        role: 'participant',
      })
      if (userCompanyError) {
        console.error('[SignupPage] user_companies insert failed:', userCompanyError.message, userCompanyError)
        setError(
          `Account created, but we could not link your company (${selectedCompany.name}). You can contact support or try again from profile settings.`,
        )
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: `${form.firstName} ${form.lastName}`,
        email: form.email,
      })
      if (profileError) {
        console.error('[SignupPage] profiles upsert failed:', profileError.message, profileError)
      }
    }

    navigate(ROUTES.DASHBOARD)
  }

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm'

  // ── STEP 1: Company selection ──────────────────────────────────────────────
  if (step === 'company') {
    return (
      <AuthLayout>
        <div className="flex justify-start mb-8">
          <img src={CORE_LOGO} alt="CORE" className="h-8 w-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">Select your company</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Choose your employer to personalize your experience
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {displayCompanies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => handleCompanySelect(company)}
              className="p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all text-left group flex flex-col"
            >
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-8 mb-3 object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white font-bold text-sm shrink-0"
                  style={{ background: company.primary_color || '#2563EB' }}
                >
                  {company.name.charAt(0)}
                </div>
              )}
              <div className="flex items-center justify-between w-full">
                <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-tight">
                  {company.name}
                </p>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 shrink-0 ml-1" />
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="brand-text font-semibold hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </AuthLayout>
    )
  }

  // ── STEP 2: Signup form ────────────────────────────────────────────────────
  return (
    <AuthLayout>
      {/* Company header */}
      <div className="flex items-center justify-between mb-6">
        {selectedCompany?.logo_url ? (
          <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="h-8 object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: primaryColor }}
            >
              {selectedCompany?.name.charAt(0)}
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{selectedCompany?.name}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setStep('company')}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
        >
          Change
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('auth.signup')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('auth.full_name')}
            </label>
            <input id="firstName" type="text" value={form.firstName} onChange={update('firstName')}
              placeholder={t('auth.enter_full_name')} required className={inputCls} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Last Name
            </label>
            <input id="lastName" type="text" value={form.lastName} onChange={update('lastName')}
              placeholder="Doe" required className={inputCls} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('auth.email')}
          </label>
          <input id="email" type="email" value={form.email} onChange={update('email')}
            placeholder={t('auth.enter_email')} required autoComplete="email" className={inputCls} />
        </div>

        {/* State + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              State
            </label>
            <select
              id="state"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">Select state...</option>
              <option>Alabama</option>
              <option>Alaska</option>
              <option>Arizona</option>
              <option>Arkansas</option>
              <option>California</option>
              <option>Colorado</option>
              <option>Connecticut</option>
              <option>Delaware</option>
              <option>Florida</option>
              <option>Georgia</option>
              <option>Hawaii</option>
              <option>Idaho</option>
              <option>Illinois</option>
              <option>Indiana</option>
              <option>Iowa</option>
              <option>Kansas</option>
              <option>Kentucky</option>
              <option>Louisiana</option>
              <option>Maine</option>
              <option>Maryland</option>
              <option>Massachusetts</option>
              <option>Michigan</option>
              <option>Minnesota</option>
              <option>Mississippi</option>
              <option>Missouri</option>
              <option>Montana</option>
              <option>Nebraska</option>
              <option>Nevada</option>
              <option>New Hampshire</option>
              <option>New Jersey</option>
              <option>New Mexico</option>
              <option>New York</option>
              <option>North Carolina</option>
              <option>North Dakota</option>
              <option>Ohio</option>
              <option>Oklahoma</option>
              <option>Oregon</option>
              <option>Pennsylvania</option>
              <option>Rhode Island</option>
              <option>South Carolina</option>
              <option>South Dakota</option>
              <option>Tennessee</option>
              <option>Texas</option>
              <option>Utah</option>
              <option>Vermont</option>
              <option>Virginia</option>
              <option>Washington</option>
              <option>West Virginia</option>
              <option>Wisconsin</option>
              <option>Wyoming</option>
            </select>
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Country
            </label>
            <select id="country" value={form.country} onChange={update('country')}
              className={inputCls}>
              <option>United States</option>
              <option>Canada</option>
              <option>United Kingdom</option>
              <option>Australia</option>
              <option>India</option>
            </select>
          </div>
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
              value={form.password}
              onChange={update('password')}
              placeholder={t('auth.enter_password')}
              required
              autoComplete="new-password"
              className={`${inputCls} pr-12`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength meter */}
          {form.password && (
            <div className="mt-2.5 space-y-2">
              {/* Bars */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.barColor : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              {/* Label */}
              <p className="text-xs font-semibold" style={{ color: strength.textColor }}>
                {strength.label}
              </p>
              {/* Checklist */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {([
                  { key: 'length', label: '8+ characters' },
                  { key: 'uppercase', label: 'Upper & lowercase' },
                  { key: 'number', label: 'At least one number' },
                  { key: 'special', label: 'Special character' },
                ] as const).map(({ key, label }) => {
                  const passed = strength.checks[key]
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      {passed
                        ? <Check className="w-3 h-3 text-green-500 shrink-0" strokeWidth={3} />
                        : <X className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" strokeWidth={3} />
                      }
                      <span className={`text-xs ${passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('auth.confirm_password')}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder={t('auth.enter_confirm_password')}
              required
              autoComplete="new-password"
              className={`${inputCls} pr-12`}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showConfirm ? t('auth.hide_password') : t('auth.show_password')}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
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
          disabled={loading || form.password !== form.confirmPassword}
          className="w-full py-3.5 font-semibold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: primaryColor }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('auth.creating_account')}
            </span>
          ) : (
            t('auth.signup')
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('auth.have_account')}{' '}
        <Link to="/login" className="brand-text font-semibold hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </AuthLayout>
  )
}
