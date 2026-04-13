import { useState, type FormEvent } from 'react'
import { ShieldCheck, Monitor, LogOut } from 'lucide-react'
import { Input } from '../../../design-system/components/Input'
import { Button } from '../../../design-system/components/Button'
import { Badge } from '../../../design-system/components/Badge'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { updatePassword } from '../../../core/auth/authService'

const mockSessions = [
  { id: '1', device: 'MacBook Pro', location: 'New York, NY', lastActive: 'Active now', current: true },
  { id: '2', device: 'iPhone 15', location: 'New York, NY', lastActive: '2 hours ago', current: false },
]

export function SecurityPanel() {
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: err } = await updatePassword(newPwd)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setCurrent('')
    setNewPwd('')
    setConfirm('')
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          {success && <p className="text-sm text-status-success">Password updated successfully.</p>}
          <Button type="submit" loading={loading} className="w-fit">
            Update password
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Two-factor authentication</CardTitle>
            <Badge variant="warning">Off</Badge>
          </div>
        </CardHeader>
        <p className="mb-4 text-sm text-text-secondary">
          Add an extra layer of security to your account with an authenticator app.
        </p>
        <Button variant="secondary" size="sm">
          <ShieldCheck className="h-4 w-4" /> Enable MFA
        </Button>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
        </CardHeader>
        <ul className="flex flex-col gap-3">
          {mockSessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 shrink-0 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.device}</p>
                  <p className="text-xs text-text-muted">
                    {s.location} · {s.lastActive}
                  </p>
                </div>
              </div>
              {s.current ? (
                <Badge variant="success">Current</Badge>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-status-danger hover:underline"
                >
                  <LogOut className="h-3.5 w-3.5" /> Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export default SecurityPanel
