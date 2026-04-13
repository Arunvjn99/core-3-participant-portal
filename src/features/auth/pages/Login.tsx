import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../../../core/hooks/useAuth'
import { useOtpStore } from '../../../core/store/otpStore'
import { ROUTES } from '../../../lib/constants'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const setOtpVerified = useOtpStore((s) => s.setOtpVerified)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    // POC: skip OTP gate — smooth demo login
    setOtpVerified(true)
    if (import.meta.env.DEV) {
      console.info('[POC] OTP verification bypassed — any code accepted')
    }
    navigate(ROUTES.DASHBOARD, { replace: true })

    // TODO production: navigate to ROUTES.VERIFY_OTP with email state
  }

  return (
    <AnimatedPage>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your participant account"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-text-link hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to={ROUTES.SIGNUP} className="font-medium text-text-link hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </AuthCard>
    </AnimatedPage>
  )
}

export default Login
