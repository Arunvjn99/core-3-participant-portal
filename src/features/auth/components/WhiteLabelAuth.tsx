/**
 * WhiteLabelAuth — Full white-label authentication component
 * Features: company selection, dynamic theming, password strength, carousel
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, ChevronLeft, ChevronRight,
  Check, X, Building2, ArrowRight, LogIn
} from 'lucide-react'
import { signUpUser, signInUser, getAllCompanies } from '../../../lib/supabaseIntegration'
import { LEGAL, ROUTES } from '@/lib/constants'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string
  name: string
  logo?: string
  theme: { primary: string; secondary: string; accent: string }
}

interface Theme {
  primary: string
  secondary: string
  accent: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPABASE_BASE = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images'

const BG_IMAGE = `${SUPABASE_BASE}/background%20auth.png`
const CORE_LOGO = `${SUPABASE_BASE}/CORE%20logo.png`
const CAROUSEL_IMAGES = [
  `${SUPABASE_BASE}/image%201.png`,
  `${SUPABASE_BASE}/image%202.png`,
  `${SUPABASE_BASE}/image%203.png`,
]

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'ascend',
    name: 'Ascend',
    theme: { primary: '#2563eb', secondary: '#1e40af', accent: '#60a5fa' },
  },
  {
    id: 'techcorp',
    name: 'TechCorp',
    theme: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#a78bfa' },
  },
  {
    id: 'innovations',
    name: 'Innovations Inc',
    theme: { primary: '#059669', secondary: '#047857', accent: '#10b981' },
  },
  {
    id: 'congruent',
    name: 'Congruent Solutions',
    theme: { primary: '#0f172a', secondary: '#1e293b', accent: '#38bdf8' },
  },
]

const DEFAULT_THEME: Theme = { primary: '#2563eb', secondary: '#1e40af', accent: '#60a5fa' }

// ─── Password strength ────────────────────────────────────────────────────────

function calcStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    mixed: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'var(--strength-weak)', 'var(--strength-fair)', 'var(--strength-good)', 'var(--strength-strong)']
  return { score, checks, label: labels[score] || '', color: colors[score] || '' }
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

function AuthCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((idx: number) => {
    setActive((idx + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)
    setPaused(true)
    setTimeout(() => setPaused(false), 6000)
  }, [])

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      setActive((c) => (c + 1) % CAROUSEL_IMAGES.length)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused])

  return (
    <div
      className="relative hidden md:flex flex-col flex-1 overflow-hidden"
      style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />


      {/* Carousel images */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-10">
        <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
          {CAROUSEL_IMAGES.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Slide ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-4 pb-8">
        <button
          onClick={() => go(active - 1)}
          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        <div className="flex gap-2">
          {CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => go(active + 1)}
          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}

// ─── Company Selector ─────────────────────────────────────────────────────────

function CompanySelector({
  companies,
  selected,
  onSelect,
}: {
  companies: Company[]
  selected: Company | null
  onSelect: (c: Company) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Select your organization
      </p>
      <div className="grid grid-cols-2 gap-3">
        {companies.map((company) => {
          const isSelected = selected?.id === company.id
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => onSelect(company)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left"
              style={{
                borderColor: isSelected ? company.theme.primary : 'var(--border-default)',
                backgroundColor: isSelected ? `${company.theme.primary}10` : 'transparent',
              }}
              aria-pressed={isSelected}
            >
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="h-8 w-auto object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: company.theme.primary }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight">
                {company.name}
              </span>
              {isSelected && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: company.theme.primary }}
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Password Strength UI ─────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string; theme: Theme }) {
  const { score, checks, label, color } = calcStrength(password)
  if (!password) return null

  const requirements = [
    { key: 'length', text: 'At least 8 characters' },
    { key: 'mixed', text: 'Mix of uppercase and lowercase' },
    { key: 'number', text: 'At least one number' },
    { key: 'special', text: 'At least one special character (!@#$%^&*)' },
  ]

  return (
    <div className="space-y-2">
      {/* Bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: bar <= score ? color : 'var(--slider-track)' }}
          />
        ))}
      </div>
      {/* Label */}
      <p className="text-xs font-semibold" style={{ color }}>
        {label}
      </p>
      {/* Checklist */}
      <div className="space-y-1">
        {requirements.map((req) => {
          const passed = checks[req.key as keyof typeof checks]
          return (
            <div key={req.key} className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{ backgroundColor: passed ? color : 'var(--slider-track)' }}
              >
                {passed
                  ? <Check className="w-2 h-2 text-white" strokeWidth={3} />
                  : <X className="w-2 h-2 text-gray-500" strokeWidth={3} />
                }
              </div>
              <span className={`text-xs ${passed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                {req.text}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Input Field ──────────────────────────────────────────────────────────────

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  theme,
  suffix,
  error,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  theme: Theme
  suffix?: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all pr-10"
          style={{ '--focus-color': theme.primary } as React.CSSProperties}
          onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primary}20` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WhiteLabelAuth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'select' | 'signup' | 'login'>('select')
  const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)

  // Signup fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [country, setCountry] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load companies from Supabase (falls back to defaults)
  useEffect(() => {
    getAllCompanies()
      .then((data) => {
        if (data?.length) {
          // Map Supabase company format to local Company format
          const mapped = data.map((c) => ({
            id: c.id,
            name: c.name,
            logo: c.logo,
            theme: {
              primary: c.primary_color,
              secondary: c.secondary_color,
              accent: c.accent_color,
            },
          }))
          setCompanies(mapped)
        }
      })
      .catch(() => { /* use defaults */ })
  }, [])

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company)
    setTheme(company.theme)
    // Persist to localStorage
    localStorage.setItem('wl_company', JSON.stringify(company))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedCompany) { setError('Please select your organization first'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    const { score } = calcStrength(password)
    if (score < 3) { setError('Password is too weak. Please strengthen it.'); return }

    setLoading(true)
    try {
      const result = await signUpUser({
        fullName,
        email,
        password,
        stateProvince,
        country,
        companyId: selectedCompany.id,
      })
      if (result.error) throw new Error(result.error.message)
      setSuccess('Account created! Check your email to confirm before signing in.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signInUser(loginEmail, loginPassword)
      if (result.error) throw new Error(result.error.message)
      navigate(ROUTES.DASHBOARD)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const primaryBtn = {
    backgroundColor: theme.primary,
    color: 'var(--text-inverse)',
  }

  const accentLink = { color: theme.accent }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* LEFT — Carousel (desktop only) */}
      <div className="md:w-[45%] hidden md:block">
        <AuthCarousel />
      </div>

      {/* RIGHT — Forms */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950">
        {/* Mobile: company logo if selected */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          {selectedCompany ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{selectedCompany.name}</span>
            </div>
          ) : (
            <img src={CORE_LOGO} alt="CORE" className="h-7 w-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          )}
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">

            {/* Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">

              {/* ── Company Selection ── */}
              {mode === 'select' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to CORE</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Select your organization to get started
                    </p>
                  </div>

                  <CompanySelector
                    companies={companies}
                    selected={selectedCompany}
                    onSelect={handleSelectCompany}
                  />

                  {selectedCompany && (
                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null) }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                        style={primaryBtn}
                      >
                        Create Account <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null) }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Sign In <LogIn className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sign Up ── */}
              {mode === 'signup' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setMode('select'); setError(null) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Account</h1>
                      {selectedCompany && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCompany.name}</p>
                      )}
                    </div>
                    {selectedCompany && (
                      <div
                        className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {success ? (
                    <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 p-4 text-sm text-green-700 dark:text-green-400">
                      {success}
                      <button
                        type="button"
                        className="block mt-3 font-semibold underline"
                        style={accentLink}
                        onClick={() => { setMode('login'); setSuccess(null) }}
                      >
                        Go to Sign In →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <Field
                        id="fullName" label="Full Name" required
                        value={fullName} onChange={setFullName}
                        placeholder="Alex Rivera" theme={theme}
                      />
                      <Field
                        id="email" label="Email Address" type="email" required
                        value={email} onChange={setEmail}
                        placeholder="alex@company.com" theme={theme}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          id="state" label="State / Province" required
                          value={stateProvince} onChange={setStateProvince}
                          placeholder="California" theme={theme}
                        />
                        <Field
                          id="country" label="Country" required
                          value={country} onChange={setCountry}
                          placeholder="United States" theme={theme}
                        />
                      </div>

                      <Field
                        id="password" label="Password"
                        type={showPassword ? 'text' : 'password'} required
                        value={password} onChange={setPassword}
                        placeholder="••••••••" theme={theme}
                        suffix={
                          <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />

                      {password && <PasswordStrength password={password} theme={theme} />}

                      <Field
                        id="confirmPassword" label="Confirm Password"
                        type={showConfirm ? 'text' : 'password'} required
                        value={confirmPassword} onChange={setConfirmPassword}
                        placeholder="••••••••" theme={theme}
                        suffix={
                          <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                        error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
                      />

                      {error && (
                        <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        style={primaryBtn}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating account...
                          </span>
                        ) : 'Create Account'}
                      </button>

                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => { setMode('login'); setError(null) }}
                          className="font-semibold hover:underline"
                          style={accentLink}
                        >
                          Sign in
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* ── Sign In ── */}
              {mode === 'login' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setMode('select'); setError(null) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sign In</h1>
                      {selectedCompany && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCompany.name}</p>
                      )}
                    </div>
                    {selectedCompany && (
                      <div
                        className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field
                      id="loginEmail" label="Email Address" type="email" required
                      value={loginEmail} onChange={setLoginEmail}
                      placeholder="alex@company.com" theme={theme}
                    />
                    <Field
                      id="loginPassword" label="Password"
                      type={showLoginPassword ? 'text' : 'password'} required
                      value={loginPassword} onChange={setLoginPassword}
                      placeholder="••••••••" theme={theme}
                      suffix={
                        <button type="button" onClick={() => setShowLoginPassword((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        className="text-sm hover:underline"
                        style={accentLink}
                        onClick={() => navigate('/forgot-password')}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                      style={primaryBtn}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : 'Sign In'}
                    </button>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null) }}
                        className="font-semibold hover:underline"
                        style={accentLink}
                      >
                        Create one
                      </button>
                    </p>
                  </form>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
              © Congruent Solutions, Inc. All Rights Reserved ·{' '}
              <LegalHrefLink href={LEGAL.privacyPolicyHref} className="hover:underline" style={accentLink}>
                Privacy Policy
              </LegalHrefLink>
              {' · '}
              <LegalHrefLink href={LEGAL.termsOfServiceHref} className="hover:underline" style={accentLink}>
                Terms of Service
              </LegalHrefLink>
              {' · '}
              <LegalHrefLink href={LEGAL.helpCenterHref} className="hover:underline" style={accentLink}>
                Help Center
              </LegalHrefLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
