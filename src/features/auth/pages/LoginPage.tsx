import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/core/supabase'
import AuthLayout from '../components/AuthLayout'

const CORE_LOGO = 'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) {
      // Demo mode — navigate directly
      navigate('/dashboard')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <AuthLayout>
      {/* CORE logo */}
      <div className="flex justify-start mb-8">
        <img
          src={CORE_LOGO}
          alt="CORE"
          className="h-8 w-auto object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email or Username"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Forgot password?
          </Link>
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
          disabled={loading}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Help */}
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Still need help? Contact{' '}
        <a
          href="mailto:support@congruentsolutions.com"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Help Center
        </a>
      </p>

      {/* Don't have account */}
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign up
        </Link>
      </p>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          © Congruent Solutions, Inc. All Rights Reserved
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400">
            Privacy Policy
          </a>
          <img
            src={CORE_LOGO}
            alt="CORE"
            className="h-5 w-auto object-contain opacity-60"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
