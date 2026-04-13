import { ShieldCheck } from 'lucide-react'

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex cursor-pointer items-center gap-2 opacity-60 transition-opacity hover:opacity-100">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span className="text-base font-bold text-gray-900 dark:text-white">
              Participant Portal
            </span>
          </div>

          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} RetireSmart Financial Services. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <a href="#" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
