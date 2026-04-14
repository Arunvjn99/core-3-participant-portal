import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/core/supabase'
import AuthLayout from '../components/AuthLayout'

const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) {
      setSent(true)
      setLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <AuthLayout>
      <img
        src={CORE_LOGO}
        alt="CORE"
        className="h-8 w-auto object-contain mb-8"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">Reset password</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 dark:text-green-400 font-semibold mb-1">Check your email</p>
          <p className="text-green-600 dark:text-green-500 text-sm">
            We&apos;ve sent a reset link to{' '}
            <span className="font-medium">{email}</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full rounded-xl py-3.5 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      )}

      <Link
        to="/login"
        className="flex items-center gap-2 mt-6 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>
    </AuthLayout>
  )
}
