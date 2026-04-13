import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '../../core/hooks/useUser'

export function EnrollmentGuard() {
  const { enrollmentStatus } = useUser()

  if (enrollmentStatus === 'complete') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default EnrollmentGuard
