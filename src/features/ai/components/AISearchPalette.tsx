import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, X, Zap } from 'lucide-react'
import { useAIStore } from '@/core/store/aiStore'
import { useNavigate } from 'react-router-dom'

const TRENDING = ['Contribution limits', 'Roth vs Traditional', 'Loan rules', 'Withdrawal rules']

const QUICK_ACTIONS = [
  { label: 'Start enrollment', path: '/enrollment/plan' },
  { label: 'Increase contribution', path: '/enrollment/contribution' },
  { label: 'Apply for loan', path: '/transactions/loan' },
]

const SUGGESTED_COMMANDS = [
  { label: 'Start enrollment', category: 'Enrollment', path: '/enrollment/plan' },
  { label: 'How to enroll?', category: 'Enrollment', path: '/enrollment/plan' },
  { label: 'Check my balance', category: 'Account', path: '/dashboard' },
  { label: 'Apply for a loan', category: 'Transactions', path: '/transactions/loan' },
]

export function AISearchPalette() {
  const { isSearchOpen, closeSearch } = useAIStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSearch])

  const filtered = query
    ? SUGGESTED_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTED_COMMANDS

  const handleSelect = (path: string) => {
    closeSearch()
    navigate(path)
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 p-4"
          onClick={closeSearch}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            {/* Gradient border search bar */}
            <div className="p-4">
              <div className="p-[2px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-400">
                <div className="flex items-center bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 gap-3">
                  <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search or ask anything about your account..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white text-sm placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0"
                    onClick={() => query && handleSelect('/dashboard')}
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              {/* Powered by */}
              <div className="flex items-center gap-1.5 mt-2 px-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-gray-400 dark:text-gray-500">Powered By Core AI</span>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-4">
              {/* Trending Searches */}
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                  Trending Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onClick={() => setQuery(t)}
                      className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Quick Actions
                  </p>
                </div>
                <div className="space-y-0.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.path}
                      type="button"
                      onClick={() => handleSelect(action.path)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested Commands */}
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                  Suggested Commands
                </p>
                <div className="space-y-0.5">
                  {filtered.map((cmd) => (
                    <button
                      key={cmd.label}
                      type="button"
                      onClick={() => handleSelect(cmd.path)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{cmd.label}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {cmd.category}
                      </span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-gray-400">No results for &quot;{query}&quot;</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Press <kbd className="rounded bg-gray-100 dark:bg-gray-700 px-1 py-0.5 text-xs">Esc</kbd> to close
              </p>
              <button
                type="button"
                onClick={closeSearch}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AISearchPalette
