import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, Mic, MicOff, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX, Check, ChevronRight, DollarSign, Wallet, GraduationCap, BarChart3, CheckCircle2, FileText, AlertCircle } from 'lucide-react'
import { useAIStore } from '@/core/store/aiStore'
import { useNavigate } from 'react-router-dom'
import { handleLocalAI } from '../services/handleLocalAI'
import { textForSpeech } from '../services/speechText'
import type { ChatMessage, CoreAIStructuredPayload, LoanSimulatorCardPayload, SelectionCardPayload, FeesCardPayload, DocumentUploadCardPayload, ReviewCardPayload, SuccessCardPayload, EnrollmentSetupPayload, EnrollmentReviewPayload, WithdrawalSliderPayload, WithdrawalReviewPayload, BalanceCardPayload, InfoCardPayload } from '../types'
import type { LocalFlowState } from '../store/flowTypes'

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-0',
    role: 'assistant',
    content: "Oh hey. If your plan stuff feels like alphabet soup, that's normal — ask me in your own words. What are you trying to figure out?",
    timestamp: new Date(),
    suggestions: ['I want to enroll', 'I need a loan', 'How much can I pull out?', 'What does vested even mean?'],
  },
]

function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const startListening = useCallback(() => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!API) return
    const r = new API()
    r.continuous = false; r.interimResults = false; r.lang = 'en-US'
    r.onresult = (e: SpeechRecognitionEvent) => { const t = e.results[0]?.[0]?.transcript; if (t) onResult(t) }
    r.onend = () => setIsListening(false)
    r.onerror = () => setIsListening(false)
    recognitionRef.current = r; r.start(); setIsListening(true)
  }, [onResult])
  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false) }, [])
  const toggle = useCallback(() => { if (isListening) stopListening(); else startListening() }, [isListening, startListening, stopListening])
  return { isListening, toggle, isSupported: typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition) }
}

function pickNaturalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => v.lang.startsWith('en'))
  if (en.length === 0) return null
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name
    if (/Samantha|Karen|Moira|Tessa|Fiona|Allison|Ava|Siri/.test(n)) return 5
    if (/Google.*English|Microsoft Aria|English \(US\)|en-US/.test(n)) return 4
    if (/Premium|Neural|Enhanced/i.test(n)) return 3
    if (v.lang === 'en-US') return 2
    return 1
  }
  return [...en].sort((a, b) => score(b) - score(a))[0] ?? null
}

function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [, bumpVoices] = useState(0)

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const onVoices = () => bumpVoices((n) => n + 1)
    synth.addEventListener('voiceschanged', onVoices)
    onVoices()
    return () => synth.removeEventListener('voiceschanged', onVoices)
  }, [])

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const cleaned = textForSpeech(text)
    if (!cleaned) return
    const u = new SpeechSynthesisUtterance(cleaned)
    const voice = pickNaturalVoice(window.speechSynthesis.getVoices())
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    } else {
      u.lang = 'en-US'
    }
    u.rate = 0.92
    u.pitch = 1
    u.volume = 1
    u.onend = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(u)
  }, [])
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setIsSpeaking(false) }, [])
  return { isSpeaking, speak, stop }
}

function money(n: number) { return `$${n.toLocaleString()}` }

function InteractiveCard({ msg, onStructured }: { msg: ChatMessage; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const t = msg.interactiveType
  const p = msg.interactivePayload as Record<string, unknown>
  if (!t || !p) return null

  if (t === 'loan_simulator_card') {
    const d = p as unknown as LoanSimulatorCardPayload
    const [amt, setAmt] = useState(d.amount)
    const [tenure, setTenure] = useState(d.tenureMonths)
    const r = d.annualRatePercent / 100 / 12
    const f = Math.pow(1 + r, tenure)
    const emi = r === 0 ? amt / tenure : (amt * r * f) / (f - 1)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-xs font-medium text-gray-600 dark:text-gray-300">Play with amount & term</p>
        <div className="mb-2"><label className="text-xs text-gray-500 dark:text-gray-400">Amount: {money(amt)}</label><input type="range" min={d.minAmount} max={d.maxAmount} step={d.amountStep ?? 100} value={amt} onChange={(e) => setAmt(+e.target.value)} className="w-full accent-blue-600" /></div>
        <div className="mb-3"><label className="text-xs text-gray-500 dark:text-gray-400">Term: {tenure} months</label><input type="range" min={d.minTenureMonths} max={d.maxTenureMonths} step={d.tenureStep} value={tenure} onChange={(e) => setTenure(+e.target.value)} className="w-full accent-blue-600" /></div>
        <div className="mb-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Est. monthly payment</p><p className="text-lg font-bold text-gray-900 dark:text-white">{money(Math.round(emi))}/mo</p></div>
        <button onClick={() => onStructured({ action: 'loan_simulator_continue', amount: amt, tenureMonths: tenure })} className="btn-brand w-full rounded-lg py-2.5 text-sm font-semibold">Continue</button>
      </div>
    )
  }

  if (t === 'selection_card') {
    const d = p as unknown as SelectionCardPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-1 text-sm font-bold text-gray-900 dark:text-white">{d.title}</p>
        {d.subtitle && <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{d.subtitle}</p>}
        <div className="space-y-2">
          {d.options.map((o) => (
            <button key={o.value} onClick={() => onStructured({ action: 'selection_card_pick', value: o.value, label: o.label })} className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <span>{o.label}</span><ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>
        {d.insight && <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">{d.insight}</p>}
      </div>
    )
  }

  if (t === 'fees_card') {
    const d = p as unknown as FeesCardPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" /><p className="text-sm font-bold text-gray-900 dark:text-white">{d.title}</p></div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Principal</span><span className="font-medium text-gray-900 dark:text-white">{money(d.principal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Processing fee</span><span className="text-red-600 dark:text-red-400">-{money(d.processingFee)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Other charges</span><span className="text-red-600 dark:text-red-400">-{money(d.otherCharges)}</span></div>
          <div className="border-t border-gray-200 pt-1.5 dark:border-gray-700"><div className="flex justify-between font-bold"><span className="text-gray-900 dark:text-white">Net amount</span><span className="text-green-600 dark:text-green-400">{money(d.netAmount)}</span></div></div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Via {d.disbursementLabel}</p>
        </div>
        <button onClick={() => onStructured({ action: 'fees_card_continue' })} className="btn-brand mt-3 w-full rounded-lg py-2.5 text-sm font-semibold">Continue</button>
      </div>
    )
  }

  if (t === 'document_upload_card') {
    const d = p as unknown as DocumentUploadCardPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" /><p className="text-sm font-bold text-gray-900 dark:text-white">{d.title}</p></div>
        <ul className="mb-3 space-y-1.5">{d.items.map((item) => (<li key={item} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><div className="h-1.5 w-1.5 rounded-full bg-blue-500" />{item}</li>))}</ul>
        {d.helper && <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{d.helper}</p>}
        <div className="flex gap-2">
          <button onClick={() => onStructured({ action: 'document_upload_card_continue' })} className="btn-brand flex-1 rounded-lg py-2.5 text-sm font-semibold">Ready to review</button>
          <button onClick={() => onStructured({ action: 'document_upload_card_continue', deferred: true })} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Upload later</button>
        </div>
      </div>
    )
  }

  if (t === 'loan_review_card') {
    const d = p as unknown as ReviewCardPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">{d.title}</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Amount</span><span className="font-medium text-gray-900 dark:text-white">{money(d.amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Net amount</span><span className="text-green-600 dark:text-green-400">{money(d.netAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Term</span><span className="text-gray-900 dark:text-white">{d.tenureMonths} months</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Monthly payment</span><span className="font-bold text-gray-900 dark:text-white">{money(Math.round(d.monthlyPayment))}/mo</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Rate</span><span className="text-gray-900 dark:text-white">{d.annualRatePercent}%</span></div>
        </div>
        <button onClick={() => onStructured({ action: 'SUBMIT_LOAN' })} className="btn-brand mt-3 w-full rounded-lg py-2.5 text-sm font-semibold">Submit loan</button>
      </div>
    )
  }

  if (t === 'loan_success_card' || t === 'success_card') {
    const d = p as unknown as SuccessCardPayload
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /><p className="text-sm font-bold text-green-800 dark:text-green-300">{d.title}</p></div>
        {d.description && <p className="mb-2 text-sm text-green-700 dark:text-green-400">{d.description}</p>}
        <p className="mb-1 text-xs text-green-600 dark:text-green-500">Processing: {d.processingTime}</p>
        <p className="mb-3 text-xs text-green-600 dark:text-green-500">{d.reassuranceMessage}</p>
        <button onClick={() => onStructured({ action: 'success_card_dismiss' })} className="w-full rounded-lg border border-green-300 bg-white py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50">{d.actionLabel ?? 'Done'}</button>
      </div>
    )
  }

  if (t === 'enrollment_setup_card') {
    const d = p as unknown as EnrollmentSetupPayload
    const [plan, setPlan] = useState(d.planOptions[1]?.value ?? 'roth')
    const [contrib, setContrib] = useState(d.contributionValue)
    const [invest, setInvest] = useState(d.investmentOptions[0])
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-gray-500 dark:text-gray-400" /><p className="text-sm font-bold text-gray-900 dark:text-white">Enrollment Setup</p></div>
        <div className="mb-3"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Plan type</label><select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">{d.planOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div className="mb-3"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Contribution: {contrib}%</label><input type="range" min={d.contributionMin} max={d.contributionMax} value={contrib} onChange={(e) => setContrib(+e.target.value)} className="w-full accent-blue-600" /></div>
        <div className="mb-3"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Investment strategy</label><select value={invest} onChange={(e) => setInvest(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">{d.investmentOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        <button onClick={() => onStructured({ action: 'enrollment_setup_continue', plan, contribution: contrib, investment: invest })} className="btn-brand w-full rounded-lg py-2.5 text-sm font-semibold">Continue</button>
      </div>
    )
  }

  if (t === 'enrollment_review_card') {
    const d = p as unknown as EnrollmentReviewPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Enrollment Review</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Plan</span><span className="font-medium text-gray-900 dark:text-white capitalize">{d.plan}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Contribution</span><span className="font-medium text-gray-900 dark:text-white">{d.contribution}%</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Investment</span><span className="font-medium text-gray-900 dark:text-white">{d.investment}</span></div>
        </div>
        <button onClick={() => onStructured({ action: 'enrollment_review_submit' })} className="btn-brand mt-3 w-full rounded-lg py-2.5 text-sm font-semibold">Submit enrollment</button>
      </div>
    )
  }

  if (t === 'withdrawal_slider_card') {
    const d = p as unknown as WithdrawalSliderPayload
    const [amt, setAmt] = useState(d.value)
    const tax = Math.round(amt * 0.1)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2"><Wallet className="h-4 w-4 text-gray-500 dark:text-gray-400" /><p className="text-sm font-bold text-gray-900 dark:text-white">Withdrawal Amount</p></div>
        <div className="mb-3"><label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Amount: {money(amt)}</label><input type="range" min={d.min} max={d.max} step={100} value={amt} onChange={(e) => setAmt(+e.target.value)} className="w-full accent-blue-600" /></div>
        <div className="mb-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tax (est. 10%)</span><span className="text-red-600 dark:text-red-400">-{money(tax)}</span></div>
          <div className="flex justify-between font-bold"><span className="text-gray-900 dark:text-white">Net</span><span className="text-green-600 dark:text-green-400">{money(amt - tax)}</span></div>
        </div>
        <button onClick={() => onStructured({ action: 'withdrawal_amount_continue', value: amt })} className="btn-brand w-full rounded-lg py-2.5 text-sm font-semibold">Continue</button>
      </div>
    )
  }

  if (t === 'withdrawal_review_card') {
    const d = p as unknown as WithdrawalReviewPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Withdrawal Review</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Amount</span><span className="text-gray-900 dark:text-white">{money(d.amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tax</span><span className="text-red-600 dark:text-red-400">-{money(d.tax)}</span></div>
          <div className="flex justify-between font-bold"><span className="text-gray-900 dark:text-white">Net</span><span className="text-green-600 dark:text-green-400">{money(d.net)}</span></div>
        </div>
        <button onClick={() => onStructured({ action: 'withdrawal_review_submit' })} className="btn-brand mt-3 w-full rounded-lg py-2.5 text-sm font-semibold">Submit withdrawal</button>
      </div>
    )
  }

  if (t === 'balance_card') {
    const d = p as unknown as BalanceCardPayload
    const pct = d.total > 0 ? Math.round((d.vested / d.total) * 100) : 0
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400" /><p className="text-sm font-bold text-gray-900 dark:text-white">Account Balance</p></div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total</span><span className="font-bold text-gray-900 dark:text-white">{money(d.total)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Vested ({pct}%)</span><span className="text-green-600 dark:text-green-400">{money(d.vested)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Unvested</span><span className="text-orange-600 dark:text-orange-400">{money(d.unvested)}</span></div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
      </div>
    )
  }

  if (t === 'info_card') {
    const d = p as unknown as InfoCardPayload
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-blue-500" /><p className="text-sm font-bold text-gray-900 dark:text-white">In plain English</p></div>
        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{d.message.replace(/\*\*/g, '')}</p>
        {d.insight && <p className="mb-2 text-xs text-blue-600 dark:text-blue-400">{d.insight}</p>}
        {d.actionLabel && d.action && <button onClick={() => onStructured(d.action!)} className="btn-brand w-full rounded-lg py-2.5 text-sm font-semibold">{d.actionLabel}</button>}
      </div>
    )
  }

  return null
}

export function CoreAIPanel() {
  const { isChatOpen, closeChat } = useAIStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set())
  const [flowState, setFlowState] = useState<LocalFlowState | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isSpeaking, speak, stop } = useTextToSpeech()
  const handleVoiceResult = useCallback((text: string) => setInput(text), [])
  const { isListening, toggle: toggleVoice, isSupported: voiceSupported } = useSpeechRecognition(handleVoiceResult)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])
  useEffect(() => { if (isChatOpen) setTimeout(() => inputRef.current?.focus(), 100) }, [isChatOpen])

  const processResult = useCallback((result: ReturnType<typeof handleLocalAI>) => {
    if (result.messages.length > 0) setMessages((prev) => [...prev, ...result.messages])
    setFlowState(result.nextState)
    if (result.navigate) { closeChat(); setTimeout(() => navigate(result.navigate!), 150) }
  }, [closeChat, navigate])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const result = handleLocalAI(trimmed, flowState)
      processResult(result)
      setIsTyping(false)
    }, 400 + Math.random() * 300)
  }, [flowState, processResult])

  const handleStructured = useCallback((payload: CoreAIStructuredPayload) => {
    setIsTyping(true)
    setTimeout(() => {
      const result = handleLocalAI('', flowState, payload)
      processResult(result)
      setIsTyping(false)
    }, 300)
  }, [flowState, processResult])

  const handleCopy = (id: string, text: string) => { navigator.clipboard.writeText(text).catch(() => {}); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }
  const handleLike = (id: string) => { setLikedIds((p) => { const n = new Set(p); n.add(id); return n }); setDislikedIds((p) => { const n = new Set(p); n.delete(id); return n }) }
  const handleDislike = (id: string) => { setDislikedIds((p) => { const n = new Set(p); n.add(id); return n }); setLikedIds((p) => { const n = new Set(p); n.delete(id); return n }) }
  const handlePlayStop = (text: string) => { if (isSpeaking) stop(); else speak(text) }

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          <motion.div
            key="ai-backdrop"
            data-core-ai-ignore-overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
            onClick={closeChat}
          />
          <motion.div
            key="ai-modal"
            data-core-ai-ignore-overlay
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="pointer-events-auto flex w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900" style={{ maxHeight: '85vh' }}>
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600"><Sparkles className="h-5 w-5 text-white" /></div>
                  <div><p className="text-sm font-bold text-gray-900 dark:text-white">Core AI</p><p className="text-xs text-gray-500 dark:text-gray-400">Plain-language help for your plan</p></div>
                </div>
                <button type="button" onClick={closeChat} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === 'assistant' ? (
                      <div className="flex max-w-[90%] gap-3">
                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600"><Sparkles className="h-3.5 w-3.5 text-white" /></div>
                        <div className="flex flex-col gap-2">
                          <div className="rounded-2xl rounded-tl-none bg-gray-50 px-4 py-3 dark:bg-gray-800">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                          </div>
                          {msg.interactiveType && <InteractiveCard msg={msg} onStructured={handleStructured} />}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">{msg.suggestions.map((chip) => (<button key={chip} type="button" onClick={() => sendMessage(chip)} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{chip}</button>))}</div>
                          )}
                          {msg.id !== 'welcome-0' && (
                            <div className="flex items-center gap-1 pl-1">
                              <button type="button" onClick={() => handleCopy(msg.id, msg.content)} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" aria-label="Copy">{copiedId === msg.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}</button>
                              <button type="button" onClick={() => handleLike(msg.id)} className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${likedIds.has(msg.id) ? 'bg-green-50 text-green-500 dark:bg-green-900/30' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'}`} aria-label="Like"><ThumbsUp className="h-3 w-3" /></button>
                              <button type="button" onClick={() => handleDislike(msg.id)} className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${dislikedIds.has(msg.id) ? 'bg-red-50 text-red-500 dark:bg-red-900/30' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'}`} aria-label="Dislike"><ThumbsDown className="h-3 w-3" /></button>
                              <button type="button" onClick={() => handlePlayStop(msg.content)} className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${isSpeaking ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/30' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'}`} aria-label={isSpeaking ? 'Stop' : 'Listen'}>{isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end"><div className="max-w-[75%] rounded-2xl rounded-tr-none bg-blue-600 px-4 py-3"><p className="text-sm leading-relaxed text-white">{msg.content}</p></div></div>
                    )}
                  </div>
                ))}
                {isTyping && (<div className="flex items-center gap-2 px-1"><div className="flex gap-1">{[0, 1, 2].map((i) => (<div key={i} className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" style={{ animationDelay: `${i * 0.15}s` }} />))}</div><span className="text-xs text-gray-400 dark:text-gray-500">One sec…</span></div>)}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-gray-100 p-4 dark:border-gray-800">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                  {voiceSupported && (<button type="button" onClick={toggleVoice} className={`shrink-0 transition-colors ${isListening ? 'animate-pulse text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} aria-label={isListening ? 'Stop listening' : 'Voice input'}>{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>)}
                  <input ref={inputRef} type="text" placeholder={isListening ? 'Listening…' : 'Type like you\'re texting a friend…'} className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)} />
                  <button type="button" onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors hover:bg-blue-200 disabled:opacity-40 dark:bg-blue-900/40 dark:hover:bg-blue-800/60" aria-label="Send"><Send className="h-4 w-4 text-blue-600 dark:text-blue-400" /></button>
                </div>
                {isListening && (<div className="mt-2 flex items-center gap-2 px-1"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /><span className="text-xs font-medium text-red-500">Listening — speak now...</span></div>)}
                <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">{"I'm not your plan document — for anything legally binding, your administrator still wins."}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CoreAIPanel
