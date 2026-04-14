import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, Mic, Copy, ThumbsUp, ThumbsDown, Volume2 } from 'lucide-react'
import { useAIStore } from '@/core/store/aiStore'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  chips?: string[]
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 0,
    role: 'assistant',
    content: "Hi, I'm Core AI — your retirement assistant. What would you like to do?",
    chips: ['I want to enroll', 'I want to apply for a loan', 'How much can I withdraw?', 'Check my vested balance'],
  },
]

export function CoreAIPanel() {
  const { isChatOpen, closeChat } = useAIStore()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isChatOpen])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: Message = { id: Date.now(), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are Core AI, a helpful retirement plan assistant for a 401(k) participant portal.
You help participants with enrollment, contributions, loans, withdrawals, transfers, and plan details.
Keep responses concise and actionable. Format amounts with dollar signs.
Current user context: enrolled participant with $30,000 plan balance.`,
          messages: messages
            .concat(userMsg)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      const aiText = data.content?.[0]?.text || 'I apologize, I could not process that.'
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: aiText }])
    } catch {
      // Fallback demo response
      const fallbacks: Record<string, string> = {
        'i want to enroll': "Great! I can help you start the enrollment process. Your plan offers Traditional 401(k) and Roth 401(k) options. The recommended contribution rate is 6% to maximize your employer match. Ready to begin?",
        'i want to apply for a loan': "You're eligible for a plan loan up to $10,000 (50% of your vested balance). The current interest rate is 8% with a maximum term of 5 years. Would you like to proceed to the loan simulator?",
        'how much can i withdraw?': "Based on your plan, you can withdraw up to $5,000 for hardship distributions. Note that early withdrawals (before age 59½) are subject to a 10% penalty plus income taxes. Would you like to explore your options?",
        'check my vested balance': "Your current vested balance is $30,000. This includes $22,000 in employee contributions and $8,000 in employer match that has fully vested. Your portfolio is up 8.4% year-to-date.",
      }
      const key = trimmed.toLowerCase()
      const fallback = fallbacks[key] || "I'm here to help with your retirement plan. You can ask me about enrollment, contributions, loans, withdrawals, or your account balance. What would you like to know?"
      setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: fallback }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
            onClick={closeChat}
          />

          {/* Modal */}
          <motion.div
            key="ai-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                 style={{ maxHeight: '80vh' }}>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="brand-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">Core AI</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeChat}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] space-y-2">
                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'brand-bg text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Quick reply chips (first AI message) */}
                      {msg.chips && msg.role === 'assistant' && (
                        <div className="flex flex-wrap gap-2">
                          {msg.chips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => sendMessage(chip)}
                              className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message actions (AI messages only) */}
                      {msg.role === 'assistant' && !msg.chips && (
                        <div className="flex items-center gap-1 pl-1">
                          {[
                            { icon: Copy, label: 'Copy' },
                            { icon: ThumbsUp, label: 'Like' },
                            { icon: ThumbsDown, label: 'Dislike' },
                            { icon: Volume2, label: 'Listen' },
                          ].map(({ icon: Icon, label }) => (
                            <button
                              key={label}
                              type="button"
                              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              aria-label={label}
                            >
                              <Icon className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">Core AI is typing...</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 shrink-0">
                <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                    aria-label="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask anything about your retirement plan..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors disabled:opacity-40 shrink-0"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Core AI can make mistakes. Verify important information with your plan administrator.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CoreAIPanel
