import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { AuthCard } from '../components/AuthCard'
import { ROUTES } from '../../../lib/constants'
import { resetPasswordForEmail } from '../../../core/auth/authService'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDemoMode(false)

    const result = await resetPasswordForEmail(email)

    if (result.demoMode) {
      setDemoMode(true)
      setSent(true)
      setLoading(false)
      return
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AnimatedPage>
        <AuthCard title="Check your email" subtitle="We've sent a password reset link to your inbox">
          {demoMode && (
            <p className="mb-4 rounded-md bg-status-warning-bg px-3 py-2 text-sm text-status-warning">
              Demo mode — no email sent. Configure Supabase URL and anon key to send real reset emails.
            </p>
          )}
          <p className="mb-4 text-sm text-text-secondary">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button type="button" onClick={() => setSent(false)} className="text-text-link hover:underline">
              try again
            </button>
            .
          </p>
          <Link to={ROUTES.LOGIN} className="text-sm text-text-link hover:underline">
            Back to sign in
          </Link>
        </AuthCard>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <AuthCard
        title="Reset password"
        subtitle="Enter your email and we'll send a reset link"
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

          {error && (
            <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>

          <Link
            to={ROUTES.LOGIN}
            className="text-center text-sm text-text-secondary hover:text-text-link"
          >
            Back to sign in
          </Link>
        </form>
      </AuthCard>
    </AnimatedPage>
  )
}

export default ForgotPassword
