import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useOtpStore } from '../store/otpStore'
import { ENV, ROUTES } from '../../lib/constants'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const otpVerified = useOtpStore((s) => s.otpVerified)
  const location = useLocation()

  // Only bypass in local development
  if (import.meta.env.DEV && (ENV.DEBUG_BYPASS_AUTH || ENV.DEMO_MODE)) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (!otpVerified) {
    return <Navigate to={ROUTES.VERIFY_OTP} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
