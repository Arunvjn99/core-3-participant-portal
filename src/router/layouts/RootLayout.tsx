import { Outlet, useRouteError, isRouteErrorResponse } from 'react-router-dom'

export function RootLayout() {
  return <Outlet />
}

export function RootErrorBoundary() {
  const error = useRouteError()

  let message = 'An unexpected error occurred.'
  let status = 500

  if (isRouteErrorResponse(error)) {
    status = error.status
    message = error.statusText || error.data?.message || message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-page p-8 text-center">
      <div className="rounded-xl bg-surface-card p-10 shadow-card max-w-md w-full">
        <p className="text-6xl font-bold text-primary mb-2">{status}</p>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Something went wrong</h1>
        <p className="text-text-secondary mb-6">{message}</p>
        <a
          href="/"
          className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-text-inverse text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  )
}

export default RootLayout
