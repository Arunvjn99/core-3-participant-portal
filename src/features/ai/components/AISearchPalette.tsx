import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, X, Zap, Search, MessageCircle, Navigation, Lightbulb } from 'lucide-react'
import { useAIStore } from '@/core/store/aiStore'
import { useNavigate } from 'react-router-dom'
import { SEARCH_SCENARIOS } from '@/core/search/scenarios/data'
import type { SearchScenario } from '@/core/search/scenarios/types'
import { getFAQMatch } from '../services/faqAnswers'

const TRENDING = ['Contribution limits', 'Roth vs Traditional', 'Loan rules', 'Vested balance']

const QUICK_ACTIONS = [
  { label: 'Start enrollment', path: '/enrollment/plan', icon: Navigation },
  { label: 'Apply for loan', path: '/transactions/loan', icon: Zap },
  { label: 'View investments', path: '/investments', icon: Lightbulb },
]

function matchScenarios(query: string): SearchScenario[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const scored: { scenario: SearchScenario; score: number }[] = []
  for (const s of SEARCH_SCENARIOS) {
    let best = 0
    for (const k of s.keywords) {
      const kk = k.toLowerCase()
      if (q.includes(kk)) best = Math.max(best, kk.length)
      else if (kk.includes(q)) best = Math.max(best, q.length * 0.8)
    }
    for (const qr of s.queries) {
      const ql = qr.toLowerCase()
      if (ql.includes(q)) best = Math.max(best, q.length * 0.9)
    }
    if (best > 0) scored.push({ scenario: s, score: best })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 8).map((s) => s.scenario)
}

function typeIcon(type: string) {
  if (type === 'navigation') return <Navigation className="h-3.5 w-3.5" />
  if (type === 'action') return <Zap className="h-3.5 w-3.5" />
  return <MessageCircle className="h-3.5 w-3.5" />
}

function typeBadgeColor(type: string) {
  if (type === 'navigation') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (type === 'action') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
}

export function AISearchPalette() {
  const { isSearchOpen, closeSearch, openChat } = useAIStore()
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isSearchOpen) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery(''); setSelectedIdx(0) }
  }, [isSearchOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSearch])

  const results = useMemo(() => matchScenarios(query), [query])
  const faqMatch = useMemo(() => query.length >= 3 ? getFAQMatch(query) : null, [query])

  const handleSelect = (path: string) => { closeSearch(); navigate(path) }

  const handleScenarioClick = (s: SearchScenario) => {
    if (s.type === 'navigation' && s.route) { handleSelect(s.route); return }
    if (s.type === 'action') {
      const actionRoutes: Record<string, string> = {
        OPEN_LOAN_FLOW: '/transactions/loan',
        OPEN_WITHDRAWAL_FLOW: '/transactions/withdrawal',
        OPEN_CONTRIBUTION_FLOW: '/enrollment/contribution',
        OPEN_REBALANCE_FLOW: '/transactions/rebalance',
        OPEN_TRANSFER_FLOW: '/transactions/transfer',
        OPEN_ROLLOVER_FLOW: '/transactions/rollover',
      }
      const route = actionRoutes[s.action ?? '']
      if (route) { handleSelect(route); return }
    }
    closeSearch()
    openChat()
  }

  const handleAskAI = () => { closeSearch(); openChat() }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIdx]) { e.preventDefault(); handleScenarioClick(results[selectedIdx]) }
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          key="search-overlay"
          data-core-ai-ignore-overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-[10vh] dark:bg-black/50"
          onClick={closeSearch}
        >
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }} transition={{ duration: 0.18 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Search input */}
            <div className="p-4">
              <div className="rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 p-[2px]">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-gray-900">
                  <Search className="h-5 w-5 shrink-0 text-purple-500" />
                  <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0) }} onKeyDown={handleKeyDown} placeholder="Search the app or ask in plain English…" className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white" />
                  {query && (<button type="button" onClick={() => setQuery('')} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>)}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 px-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-gray-400 dark:text-gray-500">Core AI</span>
                <span className="ml-auto text-xs text-gray-300 dark:text-gray-600">
                  <kbd className="rounded bg-gray-100 px-1 py-0.5 text-[10px] dark:bg-gray-800">⌘K</kbd>
                </span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
              {/* Quick Answer */}
              {faqMatch && (
                <div className="mb-4">
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                    <div className="mb-1 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Quick Answer</span>
                    </div>
                    <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{faqMatch.question}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{faqMatch.shortAnswer}</p>
                    <button type="button" onClick={handleAskAI} className="mt-2 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                      Tell me more <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Search results */}
              {query && results.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Results</p>
                  <div className="space-y-0.5">
                    {results.map((s, i) => (
                      <button key={s.id} type="button" onClick={() => handleScenarioClick(s)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${i === selectedIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${typeBadgeColor(s.type)}`}>{typeIcon(s.type)}</span>
                          <span className="text-gray-700 dark:text-gray-300">{s.queries[0]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.quickAnswer && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">Answer</span>}
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">{s.subtitle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {query && results.length === 0 && !faqMatch && (
                <div className="mb-4 text-center">
                  <p className="mb-2 text-sm text-gray-400">Nothing matched &quot;{query}&quot; — want to ask Core AI instead?</p>
                  <button type="button" onClick={handleAskAI} className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30">
                    <Sparkles className="h-4 w-4" /> Open chat
                  </button>
                </div>
              )}

              {/* Default content when no query */}
              {!query && (
                <>
                  {/* Trending */}
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Trending Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING.map((t) => (<button key={t} onClick={() => setQuery(t)} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">{t}</button>))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Quick Actions</p>
                    </div>
                    <div className="space-y-0.5">
                      {QUICK_ACTIONS.map((action) => (
                        <button key={action.path} type="button" onClick={() => handleSelect(action.path)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-2.5"><action.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" /><span>{action.label}</span></div>
                          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ask AI */}
                  <button type="button" onClick={handleAskAI} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-3 text-left transition-colors hover:bg-purple-50 dark:border-purple-700 dark:bg-purple-900/10 dark:hover:bg-purple-900/20">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30"><Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>
                    <div><p className="text-sm font-semibold text-gray-900 dark:text-white">Chat with Core AI</p><p className="text-xs text-gray-500 dark:text-gray-400">Loans, withdrawals, enrollment — ask like you would a coworker.</p></div>
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-gray-800">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span><kbd className="rounded bg-gray-100 px-1 py-0.5 text-[10px] dark:bg-gray-700">↑↓</kbd> navigate</span>
                <span><kbd className="rounded bg-gray-100 px-1 py-0.5 text-[10px] dark:bg-gray-700">↵</kbd> select</span>
                <span><kbd className="rounded bg-gray-100 px-1 py-0.5 text-[10px] dark:bg-gray-700">Esc</kbd> close</span>
              </div>
              <button type="button" onClick={closeSearch} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AISearchPalette
