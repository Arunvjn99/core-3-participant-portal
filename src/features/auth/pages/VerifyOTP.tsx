import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/core/hooks/useTheme'
import { supabase } from '@/core/supabase'
import { useAuth } from '@/core/hooks/useAuth'
import { useOtpStore } from '@/core/store/otpStore'
import { ENV, ROUTES } from '@/lib/constants'
import type { EmailOtpType } from '@supabase/supabase-js'
import AuthLayout from '../components/AuthLayout'

const CORE_LOGO =
  'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

interface VerifyLocationState {
  from?: { pathname: string }
  email?: string
  otpType?: EmailOtpType
}

const OTP_LEN = 6

export function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const setOtpVerified = useOtpStore((s) => s.setOtpVerified)
  const { resolvedMode, setMode } = useTheme()
  const toggleTheme = () => setMode(resolvedMode === 'dark' ? 'light' : 'dark')

  const state = location.state as VerifyLocationState | null
  const { user } = useAuth()
  const email = (state?.email ?? user?.email ?? '').trim()
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendHint, setResendHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const setDigitAt = (index: number, value: string) => {
    const d = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = d
      return next
    })
    if (d && index < OTP_LEN - 1) {
      requestAnimationFrame(() => inputRefs.current[index + 1]?.focus())
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (!text) return
    const next = [...digits]
    for (let i = 0; i < OTP_LEN; i++) {
      next[i] = text[i] ?? ''
    }
    setDigits(next)
    const last = Math.min(text.length, OTP_LEN) - 1
    if (last >= 0) inputRefs.current[last]?.focus()
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    setResendHint(null)
    setError(null)
    if (ENV.DEMO_MODE) {
      setResendHint('Demo mode — no email sent.')
      return
    }
    if (!email) {
      setError('We could not determine your email. Please sign in again to request a code.')
      return
    }
    setResendBusy(true)
    try {
      if (!supabase) {
        setResendHint('Demo mode — no email sent.')
        return
      }
      const resendType: 'signup' | 'email_change' =
        state?.otpType === 'email_change' ? 'email_change' : 'signup'
      const { error: resendError } = await supabase.auth.resend({
        type: resendType,
        email,
      })
      if (resendError) {
        setError(resendError.message)
        return
      }
      setResendHint('We sent a new code to your email.')
    } finally {
      setResendBusy(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Demo / UX: do not call Supabase verifyOtp — any value (or none) continues the flow.
      setOtpVerified(true)
      navigate(ROUTES.DASHBOARD, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="relative w-full">
        <div className="absolute -top-2 right-0 z-10">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="pr-12 mb-6">
          <img
            src={CORE_LOGO}
            alt="CORE"
            className="h-8 w-auto object-contain mb-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Retirement Intelligence Platform
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">by Congruent Solutions</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Verification code</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We&apos;ve sent a 6-digit code to your email address.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="sr-only">Enter the 6-digit verification code</p>
              <div className="flex gap-2 justify-center sm:justify-start" role="group" aria-label="Verification code digits">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
                    onChange={(e) => setDigitAt(i, e.target.value)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => setFocusedIndex(i)}
                    className={`w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-semibold rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none transition-all ${
                      i === focusedIndex
                        ? 'border-blue-600 ring-2 ring-blue-500/35'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
            {resendHint && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{resendHint}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full rounded-xl py-3.5 font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & continue'
              )}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendBusy}
                className="brand-text font-semibold hover:opacity-80 disabled:opacity-50"
              >
                {resendBusy ? 'Sending…' : 'Resend code'}
              </button>
              <Link to={ROUTES.LOGIN} className="brand-text font-semibold hover:opacity-80">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © Congruent Solutions, Inc. All Rights Reserved
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
            >
              Privacy Policy
            </a>
            <img
              src={CORE_LOGO}
              alt="CORE"
              className="h-5 w-auto object-contain opacity-60"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export default VerifyOTP
