import { useUser } from '../../../core/hooks/useUser'
import { PreEnrollmentDashboard } from './PreEnrollmentDashboard'
import PostEnrollmentDashboard from './PostEnrollmentDashboard'

export default function DashboardPage() {
  const { enrollmentStatus } = useUser()

  if (enrollmentStatus === 'none' || enrollmentStatus === 'in_progress') {
    return <PreEnrollmentDashboard />
  }

  return <PostEnrollmentDashboard />
}
