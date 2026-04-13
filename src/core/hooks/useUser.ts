import { useContext } from 'react'
import { UserContext } from '../user/UserContext'
import type { UserContextValue } from '../types/user.types'

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
