import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedPage } from '../../../design-system/motion/AnimatedPage'
import { Button } from '../../../design-system/components/Button'
import { Input } from '../../../design-system/components/Input'
import { AuthCard } from '../components/AuthCard'
import { ROUTES } from '../../../lib/constants'
import { updatePassword } from '../../../core/auth/authService'

export function ResetPassword() {
  const navigate = useNavigate()
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

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <AnimatedPage>
      <AuthCard title="Set new password" subtitle="Choose a strong password for your account">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Repeat your new password"
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
            Update password
          </Button>
        </form>
      </AuthCard>
    </AnimatedPage>
  )
}

export default ResetPassword
