import { Navigate, Outlet, useParams } from 'react-router-dom'
import { DEFAULT_VERSION } from '../../lib/constants'

const VALID_VERSIONS = ['v1', 'v2']

export function ValidatedVersionRoute() {
  const { version } = useParams<{ version: string }>()

  if (!version || !VALID_VERSIONS.includes(version)) {
    return <Navigate to={`/${DEFAULT_VERSION}/login`} replace />
  }

  return <Outlet />
}

export default ValidatedVersionRoute
