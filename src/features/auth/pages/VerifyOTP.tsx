import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { AuthCard } from '../components/AuthCard'
import { useOtpStore } from '../../../core/store/otpStore'
import type { EmailOtpType } from '@supabase/supabase-js'
import { ROUTES } from '../../../lib/constants'

interface VerifyLocationState {
  from?: { pathname: string }
  email?: string
  otpType?: EmailOtpType
}

export function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const setOtpVerified = useOtpStore((s) => s.setOtpVerified)

  const state = location.state as VerifyLocationState | null
  const [token, setToken] = useState('')
  const [email, setEmail] = useState(state?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (state?.email) setEmail(state.email)
  }, [state?.email])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate it's 6 digits (basic format check only)
    if (token.replace(/\s/g, '').length < 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)

    try {
      // POC MODE: Accept any code — skip Supabase OTP validation
      // TODO: Re-enable real verification for production:
      // const { error } = await verifyOtp(email, token, state?.otpType ?? 'email')
      // if (error) { setError(error.message); return }

      // Mark OTP as verified and proceed
      setOtpVerified(true)

      navigate(ROUTES.DASHBOARD, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedPage>
      <AuthCard
        title="Verify your email"
        subtitle="Enter the 6-digit code we sent to your email address"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Verification code"
            type="text"
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={6}
            required
          />

          {error && (
            <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Verify code
          </Button>
        </form>
      </AuthCard>
    </AnimatedPage>
  )
}

export default VerifyOTP
