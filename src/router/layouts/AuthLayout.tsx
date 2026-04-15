import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-surface-page">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 text-text-inverse">
        <div className="max-w-sm text-center">
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center text-3xl font-bold mb-4">
              P
            </div>
            <h1 className="text-3xl font-bold mb-2">Participant Portal</h1>
            <p className="text-white/70 text-lg">
              Manage your retirement savings, investments, and benefits — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            {['Secure Access', 'Real-time Data', 'Easy Enrolment', '24/7 Support'].map((f) => (
              <div key={f} className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence>
            <Outlet />
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
