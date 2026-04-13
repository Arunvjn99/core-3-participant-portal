import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../../../core/hooks/useAuth'
import { useOtpStore } from '../../../core/store/otpStore'
import { ROUTES } from '../../../lib/constants'

export function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const setOtpVerified = useOtpStore((s) => s.setOtpVerified)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: signUpError } = await signUp(email, password)
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // POC: skip email confirmation / verify page — go straight to app
    setOtpVerified(true)
    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  return (
    <AnimatedPage>
      <AuthCard title="Create account" subtitle="Start managing your retirement savings today">
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
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && (
            <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-text-link hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AnimatedPage>
  )
}

export default Signup
