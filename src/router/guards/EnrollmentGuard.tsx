import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { useUser } from '../../core/hooks/useUser'

export function EnrollmentGuard() {
  const { enrollmentStatus } = useUser()

  if (enrollmentStatus === 'complete') {
    return <Navigate to={ROUTES.POST_ENROLLMENT_DASHBOARD} replace />
  }

  return <Outlet />
}

export default EnrollmentGuard
