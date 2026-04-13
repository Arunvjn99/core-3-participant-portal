import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { UserContextValue, UserProfile, Company, EnrollmentStatus } from '../types/user.types'
import { fetchProfile, fetchCompany, fetchEnrollmentStatus } from './userService'
import { useAuth } from '../hooks/useAuth'

export const UserContext = createContext<UserContextValue | null>(null)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('none')
  const [loading, setLoading] = useState(false)

  const loadUserData = async () => {
    if (!user) {
      setProfile(null)
      setCompany(null)
      setEnrollmentStatus('none')
      return
    }
    setLoading(true)
    const [p, c, e] = await Promise.all([
      fetchProfile(user.id),
      fetchCompany(user.id),
      fetchEnrollmentStatus(user.id),
    ])
    setProfile(p)
    setCompany(c)
    setEnrollmentStatus(e)
    setLoading(false)
  }

  useEffect(() => {
    loadUserData()
  }, [user?.id])

  return (
    <UserContext.Provider
      value={{ profile, company, enrollmentStatus, loading, refetchProfile: loadUserData }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
