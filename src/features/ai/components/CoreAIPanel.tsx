import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, Send, Mic, MicOff, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX,
  Check, ChevronRight, DollarSign, Wallet, BarChart3, CheckCircle2, FileText,
  AlertCircle, Building, Shield, ArrowRight, TrendingUp, RefreshCw, History,
  Maximize2, Minimize2, Info, Briefcase, PieChart, Minus, Plus, ChevronUp, ChevronDown, Sun, Moon,
} from 'lucide-react'
import { useAIStore } from '@/core/store/aiStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { handleLocalAI } from '../services/handleLocalAI'
import { callLLM, detectFollowUpSuggestions } from '../services/llmService'
import type { LLMConversationEntry } from '../services/llmService'
import { textForSpeech } from '../services/speechText'
import type {
  ChatMessage,
  CoreAIStructuredPayload,
  LoanSimulatorCardPayload,
  SelectionCardPayload,
  FeesCardPayload,
  DocumentUploadCardPayload,
  ReviewCardPayload,
  SuccessCardPayload,
  PlanSelectionCardPayload,
  EnrollmentContributionPayload,
  EnrollmentInvestmentPayload,
  EnrollmentReviewPayload,
  WithdrawalTypeCardPayload,
  WithdrawalSliderPayload,
  WithdrawalReviewPayload,
  RebalanceCurrentCardPayload,
  RebalanceReviewPayload,
  RolloverTypeCardPayload,
  RolloverReviewPayload,
  InfoCardPayload,
  BalanceCardPayload,
} from '../types'
import type { LocalFlowState } from '../store/flowTypes'
import { REBALANCE_PRESETS } from '../services/userFinancials'

// ─── Theme system ─────────────────────────────────────────────────────────────

type ColorMode = 'dark' | 'light'

const DARK = {
  modalBg: '#080F1E',
  rightPanelBg: '#060C18',
  border: 'rgba(37,99,235,0.22)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  headerBg: 'linear-gradient(135deg, rgba(29,78,216,0.28) 0%, rgba(37,99,235,0.14) 100%)',
  headerBorder: 'rgba(37,99,235,0.22)',
  avatarBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  avatarGlow: '0 0 12px rgba(37,99,235,0.65)',
  badgeBg: 'rgba(37,99,235,0.18)',
  badgeColor: '#93c5fd',
  badgeBorder: 'rgba(37,99,235,0.35)',
  accentBar: 'linear-gradient(90deg, #1e40af 0%, #2563eb 55%, transparent 100%)',
  onlineDotBorder: '#080F1E',
  text: '#f8fafc',
  textMuted: 'rgba(255,255,255,0.52)',
  textSubtle: 'rgba(255,255,255,0.32)',
  msgBubbleBg: 'rgba(255,255,255,0.055)',
  msgBubbleBorder: 'rgba(255,255,255,0.1)',
  msgBubbleAccent: 'rgba(37,99,235,0.52)',
  userBubbleBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  userBubbleShadow: '0 2px 14px rgba(29,78,216,0.55)',
  chipBorder: 'rgba(37,99,235,0.32)',
  chipBg: 'rgba(37,99,235,0.1)',
  chipColor: '#93c5fd',
  chipHoverBg: 'rgba(37,99,235,0.22)',
  chipHoverBorder: 'rgba(37,99,235,0.6)',
  inputBg: 'rgba(255,255,255,0.045)',
  inputBorder: 'rgba(255,255,255,0.1)',
  inputFocusBorder: 'rgba(37,99,235,0.55)',
  inputFocusShadow: '0 0 0 3px rgba(37,99,235,0.12)',
  inputPlaceholder: 'rgba(255,255,255,0.28)',
  sendBtnBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  scrollbar: 'rgba(37,99,235,0.28) transparent',
  typingDot: '#3b82f6',
  speakActive: '#60a5fa',
  modalBorder: 'rgba(37,99,235,0.22)',
  modalShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.72), 0 0 60px rgba(37,99,235,0.07)',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.09)',
  cardLabelColor: '#93c5fd',
  cardOptionBg: 'rgba(255,255,255,0.04)',
  cardOptionBorder: 'rgba(255,255,255,0.09)',
  cardOptionHoverBorder: 'rgba(37,99,235,0.5)',
  cardOptionHoverBg: 'rgba(37,99,235,0.09)',
  cardOptionSelectedBorder: '#2563eb',
  cardOptionSelectedBg: 'rgba(37,99,235,0.14)',
  radioBorder: 'rgba(255,255,255,0.28)',
  primaryBtnBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  primaryBtnShadow: '0 0 16px rgba(37,99,235,0.35)',
  stepBg: 'rgba(255,255,255,0.04)',
  stepBorder: 'rgba(255,255,255,0.08)',
  stepDotGlow: 'rgba(37,99,235,0.55)',
  stepText: 'rgba(255,255,255,0.45)',
  hoverIcon: 'rgba(255,255,255,0.68)',
  hoverIconBg: 'rgba(255,255,255,0.08)',
  discordText: 'rgba(255,255,255,0.22)',
}

const LIGHT = {
  modalBg: '#FFFFFF',
  rightPanelBg: '#EFF6FF',
  border: 'rgba(37,99,235,0.16)',
  borderSubtle: 'rgba(37,99,235,0.1)',
  headerBg: 'linear-gradient(135deg, rgba(219,234,254,0.9) 0%, rgba(191,219,254,0.6) 100%)',
  headerBorder: 'rgba(37,99,235,0.14)',
  avatarBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  avatarGlow: '0 0 12px rgba(37,99,235,0.4)',
  badgeBg: 'rgba(37,99,235,0.1)',
  badgeColor: '#1d4ed8',
  badgeBorder: 'rgba(37,99,235,0.22)',
  accentBar: 'linear-gradient(90deg, #1e40af 0%, #2563eb 55%, transparent 100%)',
  onlineDotBorder: '#FFFFFF',
  text: '#0f172a',
  textMuted: '#475569',
  textSubtle: '#94a3b8',
  msgBubbleBg: '#F0F6FF',
  msgBubbleBorder: 'rgba(37,99,235,0.1)',
  msgBubbleAccent: 'rgba(37,99,235,0.4)',
  userBubbleBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  userBubbleShadow: '0 2px 14px rgba(29,78,216,0.3)',
  chipBorder: 'rgba(37,99,235,0.25)',
  chipBg: 'rgba(37,99,235,0.07)',
  chipColor: '#1d4ed8',
  chipHoverBg: 'rgba(37,99,235,0.14)',
  chipHoverBorder: 'rgba(37,99,235,0.45)',
  inputBg: '#F0F6FF',
  inputBorder: 'rgba(37,99,235,0.15)',
  inputFocusBorder: 'rgba(37,99,235,0.5)',
  inputFocusShadow: '0 0 0 3px rgba(37,99,235,0.1)',
  inputPlaceholder: '#94a3b8',
  sendBtnBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  scrollbar: 'rgba(37,99,235,0.18) transparent',
  typingDot: '#2563eb',
  speakActive: '#1d4ed8',
  modalBorder: 'rgba(37,99,235,0.14)',
  modalShadow: '0 0 0 1px rgba(37,99,235,0.06), 0 24px 80px rgba(0,0,0,0.14), 0 0 60px rgba(37,99,235,0.05)',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(37,99,235,0.12)',
  cardLabelColor: '#1d4ed8',
  cardOptionBg: '#FFFFFF',
  cardOptionBorder: 'rgba(37,99,235,0.12)',
  cardOptionHoverBorder: 'rgba(37,99,235,0.4)',
  cardOptionHoverBg: 'rgba(37,99,235,0.05)',
  cardOptionSelectedBorder: '#2563eb',
  cardOptionSelectedBg: 'rgba(37,99,235,0.09)',
  radioBorder: '#cbd5e1',
  primaryBtnBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  primaryBtnShadow: '0 0 16px rgba(37,99,235,0.25)',
  stepBg: 'rgba(37,99,235,0.04)',
  stepBorder: 'rgba(37,99,235,0.1)',
  stepDotGlow: 'rgba(37,99,235,0.4)',
  stepText: '#64748b',
  hoverIcon: '#1e3a8a',
  hoverIconBg: 'rgba(37,99,235,0.08)',
  discordText: '#94a3b8',
}

type Th = typeof DARK
const ThemeCtx = createContext<{ t: Th; mode: ColorMode }>(({ t: DARK, mode: 'dark' }))
const useTheme = () => useContext(ThemeCtx)

// ─── Initial messages ─────────────────────────────────────────────────────────

function buildInitialMessages(pathname: string): ChatMessage[] {
  let greeting = "Hi! I'm Core AI, your retirement plan assistant. What would you like to do today?"
  if (pathname.includes('enrollment')) greeting = "You're on the enrollment page — great time to get started! I can guide you through the whole process."
  else if (pathname.includes('transactions') || pathname.includes('loan')) greeting = "Need help with a loan or withdrawal? I can walk you through the options."
  else if (pathname.includes('investments')) greeting = "Looking at your investments? I can help you understand your allocation or guide a rebalance."

  return [{
    id: 'welcome-0',
    role: 'assistant',
    content: greeting,
    timestamp: new Date(),
    suggestions: ['I want to enroll', 'Apply for a loan', 'Withdraw money', 'Rebalance my portfolio', 'Roll over an old 401k'],
  }]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function pct(n: number) { return `${n}%` }

// ─── Voice ────────────────────────────────────────────────────────────────────

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
    if (voice) { u.voice = voice; u.lang = voice.lang } else { u.lang = 'en-US' }
    u.rate = 0.92; u.pitch = 1; u.volume = 1
    u.onend = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(u)
  }, [])
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setIsSpeaking(false) }, [])
  return { isSpeaking, speak, stop }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total, label }: { current: number; total: number; label: string }) {
  const { t } = useTheme()
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ background: t.stepBg, borderColor: t.stepBorder }}>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < current - 1
          const active = i === current - 1
          return (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: active ? 24 : 16,
                background: done
                  ? 'linear-gradient(to right, #1e40af, #2563eb)'
                  : active
                  ? '#3b82f6'
                  : t.stepBorder,
                boxShadow: done ? `0 0 6px ${t.stepDotGlow}` : undefined,
              }}
            />
          )
        })}
      </div>
      <span className="text-xs font-medium" style={{ color: t.stepText }}>
        Step {current}/{total} · {label}
      </span>
    </div>
  )
}

// ─── Shared card style hooks ──────────────────────────────────────────────────

function useCardStyles() {
  const { t } = useTheme()
  return {
    label: {
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
      letterSpacing: '0.07em', color: t.cardLabelColor,
    },
    surface: { background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16 },
    option: { background: t.cardOptionBg, border: `1px solid ${t.cardOptionBorder}`, borderRadius: 16 },
    optionSelected: { background: t.cardOptionSelectedBg, border: `1px solid ${t.cardOptionSelectedBorder}` },
    primaryBtn: {
      background: t.primaryBtnBg,
      boxShadow: t.primaryBtnShadow,
    },
    secondaryBtn: { border: `1px solid ${t.borderSubtle}`, color: t.textMuted },
    text: { color: t.text },
    textMuted: { color: t.textMuted },
    textSubtle: { color: t.textSubtle },
  }
}

const primaryBtnClass = 'w-full py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40'
const secondaryBtnClass = 'flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-80'

// ─── Card Components ──────────────────────────────────────────────────────────

function LoanSimulatorCard({ data, onStructured }: { data: LoanSimulatorCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const [amt, setAmt] = useState(data.amount)
  const [tenure, setTenure] = useState(data.tenureMonths)
  const r = data.annualRatePercent / 100 / 12
  const f = Math.pow(1 + r, tenure)
  const emi = r === 0 ? amt / tenure : (amt * r * f) / (f - 1)
  const interest = Math.round(emi) * tenure - amt

  return (
    <div className="space-y-4">
      <p style={cs.label}>Loan Simulator</p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={cs.textMuted}>Loan Amount</span>
            <span className="text-sm font-bold" style={cs.text}>{fmt(amt)}</span>
          </div>
          <input type="range" min={data.minAmount} max={data.maxAmount} step={data.amountStep ?? 100} value={amt} onChange={(e) => setAmt(+e.target.value)} className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#2563eb' }} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={cs.textSubtle}>{fmt(data.minAmount)}</span>
            <span className="text-[10px]" style={cs.textSubtle}>{fmt(data.maxAmount)}</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={cs.textMuted}>Repayment Term</span>
            <span className="text-sm font-bold" style={cs.text}>{tenure} months</span>
          </div>
          <input type="range" min={data.minTenureMonths} max={data.maxTenureMonths} step={data.tenureStep} value={tenure} onChange={(e) => setTenure(+e.target.value)} className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#2563eb' }} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={cs.textSubtle}>{data.minTenureMonths}mo</span>
            <span className="text-[10px]" style={cs.textSubtle}>{data.maxTenureMonths}mo</span>
          </div>
        </div>
      </div>
      <div className="p-4 rounded-2xl" style={cs.surface}>
        <p className="text-xs mb-1" style={cs.textSubtle}>Estimated monthly payment</p>
        <p className="text-3xl font-bold" style={cs.text}>{fmt(Math.round(emi))}<span className="text-sm font-normal" style={cs.textSubtle}>/mo</span></p>
        <div className="mt-3 flex gap-3 text-xs" style={cs.textSubtle}>
          <span>Rate: {data.annualRatePercent}% APR</span><span>·</span><span>Total interest: {fmt(interest)}</span>
        </div>
      </div>
      <button onClick={() => onStructured({ action: 'loan_simulator_continue', amount: amt, tenureMonths: tenure })} className={primaryBtnClass} style={cs.primaryBtn}>
        Continue with {fmt(Math.round(emi))}/mo <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function SelectionCard({ data, onStructured }: { data: SelectionCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const { t } = useTheme()
  return (
    <div className="space-y-3">
      <p style={cs.label}>{data.title}</p>
      {data.subtitle && <p className="text-sm" style={cs.textMuted}>{data.subtitle}</p>}
      <div className="space-y-2">
        {data.options.map((o) => (
          <button key={o.value} onClick={() => onStructured({ action: 'selection_card_pick', value: o.value, label: o.label })}
            className="w-full text-left rounded-2xl px-4 py-3.5 transition-all"
            style={cs.option}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionHoverBorder; (e.currentTarget as HTMLButtonElement).style.background = t.cardOptionHoverBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionBorder; (e.currentTarget as HTMLButtonElement).style.background = t.cardOptionBg }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={cs.text}>{o.label}</p>
                {o.description && <p className="text-xs mt-0.5" style={cs.textMuted}>{o.description}</p>}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={cs.textSubtle} />
            </div>
          </button>
        ))}
      </div>
      {data.insight && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-400">{data.insight}</p>
        </div>
      )}
    </div>
  )
}

function FeesCard({ data, onStructured }: { data: FeesCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" style={{ color: '#60a5fa' }} />
        <p style={cs.label}>{data.title}</p>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-sm" style={cs.textMuted}>Principal</span>
          <span className="text-sm font-semibold" style={cs.text}>{fmt(data.principal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={cs.textMuted}>Processing fee</span>
          <span className="text-sm font-medium text-red-400">−{fmt(data.processingFee)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={cs.textMuted}>Other charges</span>
          <span className="text-sm font-medium text-red-400">−{fmt(data.otherCharges)}</span>
        </div>
        <div className="pt-2.5 flex justify-between items-center" style={{ borderTop: `1px solid ${cs.textSubtle.color}22` }}>
          <span className="text-sm font-semibold" style={cs.text}>You receive</span>
          <span className="text-lg font-bold text-emerald-400">{fmt(data.netAmount)}</span>
        </div>
        <p className="text-xs" style={cs.textSubtle}>Via {data.disbursementLabel}</p>
      </div>
      <button onClick={() => onStructured({ action: 'fees_card_continue' })} className={primaryBtnClass} style={cs.primaryBtn}>Looks good, continue</button>
    </div>
  )
}

function DocumentUploadCard({ data, onStructured }: { data: DocumentUploadCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" style={{ color: '#60a5fa' }} />
        <p style={cs.label}>{data.title}</p>
      </div>
      <ul className="space-y-2.5">
        {data.items.map((item) => (
          <li key={item} className="flex items-center gap-3 rounded-xl px-4 py-3" style={cs.surface}>
            <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
            <span className="text-sm" style={cs.text}>{item}</span>
          </li>
        ))}
      </ul>
      {data.helper && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400">{data.helper}</p>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onStructured({ action: 'document_upload_card_continue' })} className={primaryBtnClass} style={cs.primaryBtn}>I'm ready to review</button>
        <button onClick={() => onStructured({ action: 'document_upload_card_continue', deferred: true })} className={secondaryBtnClass} style={cs.secondaryBtn}>Upload later</button>
      </div>
    </div>
  )
}

function LoanReviewCard({ data, onStructured }: { data: ReviewCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const [expanded, setExpanded] = useState(false)
  const rows = [
    { label: 'Loan amount', value: fmt(data.amount) },
    { label: 'You receive', value: fmt(data.netAmount), highlight: true },
    { label: 'Repayment term', value: `${data.tenureMonths} months` },
    { label: 'Monthly payment', value: `${fmt(Math.round(data.monthlyPayment))}/mo`, bold: true },
    { label: 'Annual rate', value: `${data.annualRatePercent}%` },
    { label: 'Disbursement', value: data.disbursementLabel },
  ]
  return (
    <div className="space-y-4">
      <p style={cs.label}>Loan Summary</p>
      <div className="space-y-2.5">
        {rows.map(({ label, value, highlight, bold }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-sm" style={cs.textMuted}>{label}</span>
            <span className={`text-sm font-medium ${highlight ? 'text-emerald-400 font-bold text-base' : bold ? 'font-bold' : ''}`} style={highlight || bold ? undefined : cs.text}>{value}</span>
          </div>
        ))}
      </div>
      {data.schedulePreview && data.schedulePreview.length > 0 && (
        <div>
          <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#60a5fa' }}>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide' : 'Preview'} payment schedule
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {data.schedulePreview.map((row) => (
                <div key={row.month} className="flex justify-between text-xs" style={cs.textSubtle}>
                  <span>{row.dueDateLabel}</span>
                  <span className="font-medium" style={cs.textMuted}>{fmt(row.payment)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button onClick={() => onStructured({ action: 'SUBMIT_LOAN' })} className={primaryBtnClass} style={cs.primaryBtn}>Submit loan application</button>
    </div>
  )
}

function SuccessCard({ data, onStructured }: { data: SuccessCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-4">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16,185,129,0.15)', boxShadow: '0 0 24px rgba(16,185,129,0.25)' }}>
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-base font-bold" style={cs.text}>{data.title}</h3>
        {data.description && <p className="text-sm mt-1" style={cs.textMuted}>{data.description}</p>}
      </div>
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-300">Processing time: {data.processingTime}</span>
        </div>
        <p className="text-xs text-emerald-400/70 pl-6">{data.reassuranceMessage}</p>
      </div>
      <button onClick={() => onStructured({ action: 'success_card_dismiss' })} className={primaryBtnClass} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 0 16px rgba(16,185,129,0.3)' }}>
        {data.actionLabel ?? 'Done'}
      </button>
    </div>
  )
}

function PlanSelectionCard({ data, onStructured }: { data: PlanSelectionCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const { t } = useTheme()
  const [selected, setSelected] = useState(data.selectedPlanId ?? data.plans[0]?.id ?? '')

  return (
    <div className="space-y-3">
      <p style={cs.label}>Plan Options</p>
      <p className="text-sm" style={cs.textMuted}>Compare and choose the plan that fits you best.</p>
      <div className="space-y-2.5">
        {data.plans.map((plan) => {
          const isSelected = selected === plan.id
          return (
            <button key={plan.id} onClick={() => setSelected(plan.id)}
              className="w-full text-left rounded-2xl p-4 transition-all"
              style={isSelected ? cs.optionSelected : cs.option}
              onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionHoverBorder; (e.currentTarget as HTMLButtonElement).style.background = t.cardOptionHoverBg } }}
              onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionBorder; (e.currentTarget as HTMLButtonElement).style.background = t.cardOptionBg } }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                    style={{ borderColor: isSelected ? '#2563eb' : t.radioBorder, background: isSelected ? '#2563eb' : 'transparent' }}>
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-semibold" style={cs.text}>{plan.label}</span>
                </div>
                {plan.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>{plan.badge}</span>
                )}
              </div>
              <p className="text-xs ml-[26px] mb-2" style={cs.textMuted}>{plan.subtitle}</p>
              <div className="ml-[22px] space-y-1 mb-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-xs" style={cs.textMuted}>{f}</span>
                  </div>
                ))}
              </div>
              <div className="ml-[22px] flex items-center justify-between">
                <span className="text-xs" style={cs.textSubtle}>Est. Annual Savings</span>
                <span className="text-base font-bold" style={cs.text}>{fmt(plan.estimatedAnnualSavings)}</span>
              </div>
            </button>
          )
        })}
      </div>
      <button onClick={() => { const plan = data.plans.find((p) => p.id === selected); if (plan) onStructured({ action: 'plan_selected', planId: plan.id, planLabel: plan.label }) }}
        disabled={!selected} className={primaryBtnClass} style={cs.primaryBtn}>
        Select this plan <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function EnrollmentContributionCard({ data, onStructured }: { data: EnrollmentContributionPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const [contrib, setContrib] = useState(data.contributionValue)
  const annualContrib = Math.round((data.estimatedAnnualSavings / 100) * contrib * 12)
  const matchedPct = Math.min(contrib, data.employerMatchPercent)

  return (
    <div className="space-y-4">
      <p style={cs.label}>Set Your Contribution</p>
      <div className="p-4 rounded-2xl" style={cs.surface}>
        <p className="text-xs mb-0.5" style={cs.textSubtle}>{data.planLabel}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold" style={cs.text}>{pct(contrib)}</p>
            <p className="text-xs" style={cs.textSubtle}>of each paycheck</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-blue-400">+{pct(matchedPct)} matched</p>
            <p className="text-xs" style={cs.textSubtle}>employer match</p>
          </div>
        </div>
      </div>
      <div>
        <input type="range" min={data.contributionMin} max={data.contributionMax} value={contrib} onChange={(e) => setContrib(+e.target.value)} className="w-full h-2 rounded-full cursor-pointer" style={{ accentColor: '#2563eb' }} />
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={cs.textSubtle}>{pct(data.contributionMin)}</span>
          <span className="text-[10px]" style={cs.textSubtle}>{pct(data.contributionMax)}</span>
        </div>
      </div>
      {contrib < data.employerMatchPercent && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400">Increase to {pct(data.employerMatchPercent)} to capture the full employer match — that's free money.</p>
        </div>
      )}
      <div className="flex justify-between items-center rounded-xl px-4 py-3" style={cs.surface}>
        <span className="text-sm" style={cs.textMuted}>Est. annual savings</span>
        <span className="text-sm font-bold" style={cs.text}>{fmt(annualContrib)}</span>
      </div>
      <button onClick={() => onStructured({ action: 'enrollment_contribution_set', planId: data.planId, planLabel: data.planLabel, contribution: contrib })} className={primaryBtnClass} style={cs.primaryBtn}>
        Continue with {pct(contrib)} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function EnrollmentInvestmentCard({ data, onStructured }: { data: EnrollmentInvestmentPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const { t } = useTheme()
  const [selected, setSelected] = useState(data.investmentOptions[0]?.value ?? '')
  return (
    <div className="space-y-3">
      <p style={cs.label}>Investment Strategy</p>
      <div className="space-y-2">
        {data.investmentOptions.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              className="w-full text-left rounded-2xl p-3.5 transition-all"
              style={isSelected ? cs.optionSelected : cs.option}
              onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionHoverBorder } }}
              onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionBorder } }}>
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                  style={{ borderColor: isSelected ? '#2563eb' : t.radioBorder, background: isSelected ? '#2563eb' : 'transparent' }}>
                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={cs.text}>{opt.label}</p>
                  <p className="text-xs" style={cs.textMuted}>{opt.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <button onClick={() => { const opt = data.investmentOptions.find((o) => o.value === selected); onStructured({ action: 'enrollment_investment_set', planId: data.planId, planLabel: data.planLabel, contribution: data.contribution, investment: opt?.label ?? selected }) }}
        disabled={!selected} className={primaryBtnClass} style={cs.primaryBtn}>
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function EnrollmentReviewCard({ data, onStructured }: { data: EnrollmentReviewPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <p style={cs.label}>Enrollment Summary</p>
      <div className="space-y-2.5">
        {[
          { label: 'Plan', value: data.planLabel },
          { label: 'Contribution', value: pct(data.contribution) },
          { label: 'Investment', value: data.investment },
          { label: 'Est. Annual Savings', value: fmt(data.estimatedAnnualSavings), highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-sm" style={cs.textMuted}>{label}</span>
            <span className="text-sm font-semibold" style={highlight ? { color: '#60a5fa' } : cs.text}>{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs" style={cs.textSubtle}>Effective from your next pay cycle. You can update these settings anytime.</p>
      <button onClick={() => onStructured({ action: 'enrollment_review_submit' })} className={primaryBtnClass} style={cs.primaryBtn}>Confirm enrollment</button>
    </div>
  )
}

function WithdrawalTypeCard({ data, onStructured }: { data: WithdrawalTypeCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-3">
      <p style={cs.label}>Withdrawal Type</p>
      <div className="space-y-2">
        {data.options.map((opt) => (
          <button key={opt.id} onClick={() => opt.eligible && onStructured({ action: 'withdrawal_type_selected', withdrawalType: opt.id, withdrawalTypeLabel: opt.label })}
            disabled={!opt.eligible}
            className="w-full text-left rounded-2xl p-4 transition-all"
            style={{ ...cs.option, opacity: opt.eligible ? 1 : 0.4, cursor: opt.eligible ? 'pointer' : 'not-allowed' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold" style={cs.text}>{opt.label}</p>
                <p className="text-xs mt-0.5" style={cs.textMuted}>{opt.description}</p>
                {opt.note && <p className="text-xs text-amber-400 mt-1">{opt.note}</p>}
              </div>
              {opt.eligible && <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={cs.textSubtle} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function WithdrawalSliderCard({ data, onStructured }: { data: WithdrawalSliderPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const [amt, setAmt] = useState(data.value)
  const tax = Math.round(amt * 0.1)
  const net = amt - tax

  return (
    <div className="space-y-4">
      <p style={cs.label}>Withdrawal Amount{data.withdrawalType ? ` · ${data.withdrawalType.replace(/_/g, ' ')}` : ''}</p>
      <div className="p-4 rounded-2xl" style={{ ...cs.surface, borderColor: 'rgba(251,146,60,0.25)', background: 'rgba(251,146,60,0.08)' }}>
        <p className="text-xs mb-0.5" style={cs.textSubtle}>You withdraw</p>
        <p className="text-3xl font-bold" style={cs.text}>{fmt(amt)}</p>
      </div>
      <div>
        <input type="range" min={data.min} max={data.max} step={100} value={amt} onChange={(e) => setAmt(+e.target.value)} className="w-full h-2 rounded-full cursor-pointer" style={{ accentColor: '#f97316' }} />
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={cs.textSubtle}>{fmt(data.min)}</span>
          <span className="text-[10px]" style={cs.textSubtle}>{fmt(data.max)}</span>
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-sm" style={cs.textMuted}>Est. 10% withholding tax</span>
          <span className="text-sm font-medium text-red-400">−{fmt(tax)}</span>
        </div>
        <div className="flex justify-between items-center pt-2.5" style={{ borderTop: `1px solid ${cs.textSubtle.color}22` }}>
          <span className="text-sm font-semibold" style={cs.text}>You receive</span>
          <span className="text-base font-bold text-emerald-400">{fmt(net)}</span>
        </div>
      </div>
      <button onClick={() => onStructured({ action: 'withdrawal_amount_continue', value: amt })} className={primaryBtnClass} style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 0 16px rgba(249,115,22,0.3)' }}>
        Continue with {fmt(amt)}
      </button>
    </div>
  )
}

function WithdrawalReviewCard({ data, onStructured }: { data: WithdrawalReviewPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" style={{ color: '#60a5fa' }} />
        <p style={cs.label}>Withdrawal Review</p>
      </div>
      <div className="space-y-2.5">
        {data.withdrawalType && <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Type</span><span className="text-sm font-medium capitalize" style={cs.text}>{data.withdrawalType.replace(/_/g, ' ')}</span></div>}
        <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Gross amount</span><span className="text-sm font-medium" style={cs.text}>{fmt(data.amount)}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Tax withheld (10%)</span><span className="text-sm font-medium text-red-400">−{fmt(data.tax)}</span></div>
        {data.method && <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Delivery</span><span className="text-sm font-medium" style={cs.text}>{data.method === 'eft' ? 'Bank transfer (ACH)' : 'Check by mail'}</span></div>}
        <div className="pt-2.5 flex justify-between items-center" style={{ borderTop: `1px solid ${cs.textSubtle.color}22` }}>
          <span className="text-sm font-bold" style={cs.text}>You receive</span>
          <span className="text-lg font-bold text-emerald-400">{fmt(data.net)}</span>
        </div>
      </div>
      <button onClick={() => onStructured({ action: 'withdrawal_review_submit' })} className={primaryBtnClass} style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 0 16px rgba(249,115,22,0.3)' }}>
        Submit withdrawal
      </button>
    </div>
  )
}

function RebalanceCurrentCard({ data, onStructured }: { data: RebalanceCurrentCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const { t } = useTheme()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const riskColors: Record<string, string> = {
    conservative: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
    moderate: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-400',
    aggressive: 'border-red-500/30 bg-red-500/15 text-red-400',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="h-4 w-4" style={{ color: '#60a5fa' }} />
        <p style={cs.label}>Current Allocation</p>
      </div>
      <div className="space-y-2">
        {data.currentAllocation.map((fund) => (
          <div key={fund.ticker} className="flex items-center gap-3 rounded-xl px-4 py-3" style={cs.surface}>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium" style={cs.text}>{fund.fund}</span>
                <span className="text-xs" style={cs.textSubtle}>{fund.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.borderSubtle }}>
                <div className="h-full rounded-full" style={{ width: `${fund.percent}%`, background: 'linear-gradient(to right, #1e40af, #2563eb)' }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold" style={cs.text}>{fmt(fund.value)}</p>
              <p className={`text-[10px] ${fund.ytdReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}% YTD</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold mt-2" style={cs.textSubtle}>Choose a target strategy</p>
      <div className="space-y-2">
        {data.presets.map((preset) => {
          const isSelected = selectedPreset === preset.id
          return (
            <button key={preset.id} onClick={() => setSelectedPreset(preset.id)}
              className="w-full text-left rounded-2xl p-3.5 transition-all"
              style={isSelected ? cs.optionSelected : cs.option}
              onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionHoverBorder }}
              onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = t.cardOptionBorder }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                    style={{ borderColor: isSelected ? '#2563eb' : t.radioBorder, background: isSelected ? '#2563eb' : 'transparent' }}>
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={cs.text}>{preset.label}</p>
                    <p className="text-xs" style={cs.textMuted}>{preset.description}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColors[preset.riskLevel] ?? ''}`}>{preset.riskLevel}</span>
              </div>
            </button>
          )
        })}
      </div>
      <button onClick={() => { const preset = REBALANCE_PRESETS.find((p) => p.id === selectedPreset); if (preset) onStructured({ action: 'rebalance_preset_selected', presetId: preset.id, presetLabel: preset.label }) }}
        disabled={!selectedPreset} className={primaryBtnClass} style={cs.primaryBtn}>
        Review trades <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function RebalanceReviewCard({ data, onStructured }: { data: RebalanceReviewPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const { t } = useTheme()
  const total = data.totalBalance
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" style={{ color: '#60a5fa' }} />
        <p style={cs.label}>Trade Preview · {data.targetPreset.label}</p>
      </div>
      <div className="space-y-2">
        {data.targetPreset.funds.map((target) => {
          const current = data.currentAllocation.find((f) => f.ticker === target.ticker)
          const currentPct = current?.percent ?? 0
          const diff = target.percent - currentPct
          return (
            <div key={target.ticker} className="rounded-xl px-4 py-3" style={cs.surface}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium" style={cs.text}>{target.fund}</span>
                <div className="flex items-center gap-1">
                  {diff !== 0 && (
                    <span className={`text-[10px] font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff > 0 ? <Plus className="h-2.5 w-2.5 inline" /> : <Minus className="h-2.5 w-2.5 inline" />}{Math.abs(diff)}%
                    </span>
                  )}
                  <span className="text-xs" style={cs.textSubtle}>{currentPct}% → <span className="font-semibold" style={cs.text}>{target.percent}%</span></span>
                </div>
              </div>
              <div className="h-1.5 rounded-full relative overflow-hidden" style={{ background: t.borderSubtle }}>
                <div className="absolute inset-0 h-full rounded-full opacity-40 transition-all" style={{ width: `${currentPct}%`, background: '#60a5fa' }} />
                <div className="absolute inset-0 h-full rounded-full transition-all" style={{ width: `${target.percent}%`, background: 'linear-gradient(to right, #1e40af, #2563eb)', opacity: 0.7 }} />
              </div>
              <p className="text-[10px] mt-1" style={cs.textSubtle}>{fmt(Math.round(total * target.percent / 100))}</p>
            </div>
          )
        })}
      </div>
      <button onClick={() => onStructured({ action: 'rebalance_review_submit' })} className={primaryBtnClass} style={cs.primaryBtn}>Confirm rebalance</button>
    </div>
  )
}

function RolloverTypeCard({ data, onStructured }: { data: RolloverTypeCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  const { t: th } = useTheme()
  const iconMap: Record<string, React.ReactNode> = { // eslint-disable-line @typescript-eslint/no-unused-vars
    building: <Building className="h-5 w-5 text-blue-400" />,
    bank: <Briefcase className="h-5 w-5 text-cyan-400" />,
    shield: <Shield className="h-5 w-5 text-emerald-400" />,
  }
  return (
    <div className="space-y-3">
      <p style={cs.label}>Rollover Source</p>
      <div className="space-y-2">
        {data.options.map((opt) => (
          <button key={opt.id} onClick={() => onStructured({ action: 'rollover_type_selected', rolloverType: opt.id, rolloverTypeLabel: opt.label })}
            className="w-full text-left rounded-2xl px-4 py-3.5 transition-all"
            style={cs.option}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = th.cardOptionHoverBorder; (e.currentTarget as HTMLButtonElement).style.background = th.cardOptionHoverBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = th.cardOptionBorder; (e.currentTarget as HTMLButtonElement).style.background = th.cardOptionBg }}>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={cs.surface}>{iconMap[opt.icon]}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={cs.text}>{opt.label}</p>
                <p className="text-xs mt-0.5" style={cs.textMuted}>{opt.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={cs.textSubtle} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function RolloverReviewCard({ data, onStructured }: { data: RolloverReviewPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <p style={cs.label}>Rollover Summary</p>
      <div className="space-y-3">
        <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Source type</span><span className="text-sm font-semibold" style={cs.text}>{data.rolloverTypeLabel}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Transfer method</span><span className="text-sm font-medium" style={cs.text}>Direct rollover</span></div>
        <div className="flex justify-between items-center"><span className="text-sm" style={cs.textMuted}>Tax withholding</span><span className="text-sm font-medium text-emerald-400">None (direct rollover)</span></div>
      </div>
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-blue-400">What happens next</p>
        {['We send transfer instructions to your previous provider', 'They initiate the transfer (3–10 business days)', 'Funds arrive and are invested per your election'].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] font-bold text-blue-400 border border-blue-500/30 bg-blue-500/20 rounded-full h-4 w-4 flex items-center justify-center shrink-0">{i + 1}</span>
            <p className="text-xs text-blue-400">{s}</p>
          </div>
        ))}
      </div>
      <button onClick={() => onStructured({ action: 'rollover_review_submit' })} className={primaryBtnClass} style={cs.primaryBtn}>Initiate rollover</button>
    </div>
  )
}

function BalanceCard({ data }: { data: BalanceCardPayload }) {
  const cs = useCardStyles()
  const { t } = useTheme()
  const pctNum = data.vestedPercent ?? (data.total > 0 ? Math.round((data.vested / data.total) * 100) : 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" style={{ color: '#60a5fa' }} />
        <p style={cs.label}>Account Balance</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: data.total, color: cs.text.color },
          { label: 'Vested', value: data.vested, color: '#34d399' },
          { label: 'Unvested', value: data.unvested, color: '#fbbf24' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={cs.surface}>
            <p className="text-[10px] mb-1" style={cs.textSubtle}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>{fmt(value)}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs" style={cs.textSubtle}>Vested ({pctNum}%)</span>
          <span className="text-xs" style={cs.textSubtle}>Unvested ({100 - pctNum}%)</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: t.borderSubtle }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctNum}%`, background: 'linear-gradient(to right, #059669, #34d399)' }} />
        </div>
      </div>
      {data.allocation && data.allocation.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs" style={cs.textSubtle}>Allocation</p>
          {data.allocation.map((f) => (
            <div key={f.ticker} className="flex items-center gap-2">
              <div className="h-1.5 rounded-full" style={{ width: Math.max(f.percent * 0.8, 8), background: 'linear-gradient(to right, #1e40af, #2563eb)' }} />
              <span className="text-xs flex-1" style={cs.textMuted}>{f.fund}</span>
              <span className="text-xs font-medium" style={cs.text}>{f.percent}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoCard({ data, onStructured }: { data: InfoCardPayload; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const cs = useCardStyles()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <p style={cs.label}>In Plain English</p>
      </div>
      {data.vestedPercent != null && (
        <div className="flex flex-col items-center py-2">
          <div className="relative h-20 w-20 mb-2">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray={`${data.vestedPercent} ${100 - data.vestedPercent}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={cs.text}>{data.vestedPercent}%</span>
          </div>
          <p className="text-xs" style={cs.textSubtle}>vested</p>
        </div>
      )}
      <p className="text-sm leading-relaxed" style={cs.text}>{data.message.replace(/\*\*/g, '')}</p>
      {data.insight && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
          <TrendingUp className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-400">{data.insight}</p>
        </div>
      )}
      {data.actionLabel && data.action && (
        <button onClick={() => onStructured(data.action!)} className={primaryBtnClass} style={cs.primaryBtn}>{data.actionLabel}</button>
      )}
    </div>
  )
}

// ─── Panel Dispatcher ─────────────────────────────────────────────────────────

function InteractivePanel({ msg, onStructured }: { msg: ChatMessage; onStructured: (p: CoreAIStructuredPayload) => void }) {
  const t = msg.interactiveType
  const p = msg.interactivePayload as Record<string, unknown>
  if (!t || !p) return null
  switch (t) {
    case 'loan_simulator_card': return <LoanSimulatorCard data={p as unknown as LoanSimulatorCardPayload} onStructured={onStructured} />
    case 'selection_card': return <SelectionCard data={p as unknown as SelectionCardPayload} onStructured={onStructured} />
    case 'fees_card': return <FeesCard data={p as unknown as FeesCardPayload} onStructured={onStructured} />
    case 'document_upload_card': return <DocumentUploadCard data={p as unknown as DocumentUploadCardPayload} onStructured={onStructured} />
    case 'loan_review_card': return <LoanReviewCard data={p as unknown as ReviewCardPayload} onStructured={onStructured} />
    case 'success_card':
    case 'loan_success_card': return <SuccessCard data={p as unknown as SuccessCardPayload} onStructured={onStructured} />
    case 'plan_selection_card': return <PlanSelectionCard data={p as unknown as PlanSelectionCardPayload} onStructured={onStructured} />
    case 'enrollment_contribution_card': return <EnrollmentContributionCard data={p as unknown as EnrollmentContributionPayload} onStructured={onStructured} />
    case 'enrollment_investment_card': return <EnrollmentInvestmentCard data={p as unknown as EnrollmentInvestmentPayload} onStructured={onStructured} />
    case 'enrollment_review_card': return <EnrollmentReviewCard data={p as unknown as EnrollmentReviewPayload} onStructured={onStructured} />
    case 'withdrawal_type_card': return <WithdrawalTypeCard data={p as unknown as WithdrawalTypeCardPayload} onStructured={onStructured} />
    case 'withdrawal_slider_card': return <WithdrawalSliderCard data={p as unknown as WithdrawalSliderPayload} onStructured={onStructured} />
    case 'withdrawal_review_card': return <WithdrawalReviewCard data={p as unknown as WithdrawalReviewPayload} onStructured={onStructured} />
    case 'rebalance_current_card': return <RebalanceCurrentCard data={p as unknown as RebalanceCurrentCardPayload} onStructured={onStructured} />
    case 'rebalance_review_card': return <RebalanceReviewCard data={p as unknown as RebalanceReviewPayload} onStructured={onStructured} />
    case 'rollover_type_card': return <RolloverTypeCard data={p as unknown as RolloverTypeCardPayload} onStructured={onStructured} />
    case 'rollover_review_card': return <RolloverReviewCard data={p as unknown as RolloverReviewPayload} onStructured={onStructured} />
    case 'balance_card': return <BalanceCard data={p as unknown as BalanceCardPayload} />
    case 'info_card': return <InfoCard data={p as unknown as InfoCardPayload} onStructured={onStructured} />
    default: return null
  }
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function CoreAIPanel() {
  const { isChatOpen, closeChat } = useAIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [colorMode, setColorMode] = useState<ColorMode>('dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const t = colorMode === 'dark' ? DARK : LIGHT
  const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialMessages(location.pathname))
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set())
  const [flowState, setFlowState] = useState<LocalFlowState | null>(null)
  const llmHistoryRef = useRef<LLMConversationEntry[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isSpeaking, speak, stop } = useTextToSpeech()
  const handleVoiceResult = useCallback((text: string) => { setInput(text) }, [])
  const { isListening, toggle: toggleVoice, isSupported: voiceSupported } = useSpeechRecognition(handleVoiceResult)

  const activePanelMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.interactiveType) return messages[i]
    }
    return null
  }, [messages])

  const hasPanel = activePanelMsg != null

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])
  useEffect(() => { if (isChatOpen) setTimeout(() => inputRef.current?.focus(), 150) }, [isChatOpen])

  const processResult = useCallback(
    (result: ReturnType<typeof handleLocalAI>) => {
      if (result.messages.length > 0) setMessages((prev) => [...prev, ...result.messages])
      setFlowState(result.nextState)
      if (result.navigate) { closeChat(); setTimeout(() => navigate(result.navigate!), 150) }
    },
    [closeChat, navigate],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsTyping(true)

      await new Promise((r) => setTimeout(r, 320 + Math.random() * 200))
      const result = handleLocalAI(trimmed, flowState)

      if (result.isLLMFallback) {
        // Route to Groq LLM for conversational responses
        try {
          const llmContent = await callLLM(trimmed, llmHistoryRef.current)
          llmHistoryRef.current = [
            ...llmHistoryRef.current,
            { role: 'user' as const, content: trimmed },
            { role: 'assistant' as const, content: llmContent },
          ].slice(-10)

          const llmMsg: ChatMessage = {
            id: `ai-llm-${Date.now()}`,
            role: 'assistant',
            content: llmContent,
            timestamp: new Date(),
            suggestions: detectFollowUpSuggestions(llmContent),
          }
          setMessages((prev) => [...prev, llmMsg])
          setFlowState(result.nextState)
        } catch {
          processResult(result)
        }
      } else {
        processResult(result)
      }

      setIsTyping(false)
    },
    [flowState, processResult],
  )

  const handleStructured = useCallback(
    (payload: CoreAIStructuredPayload) => {
      setIsTyping(true)
      setTimeout(() => {
        const result = handleLocalAI('', flowState, payload)
        processResult(result)
        setIsTyping(false)
      }, 300)
    },
    [flowState, processResult],
  )

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReset = () => {
    setMessages(buildInitialMessages(location.pathname))
    setFlowState(null)
    setInput('')
    llmHistoryRef.current = []
  }

  return (
    <ThemeCtx.Provider value={{ t, mode: colorMode }}>
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="ai-backdrop"
              data-core-ai-ignore-overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ background: colorMode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.35)' }}
              onClick={closeChat}
            />

            {/* Modal */}
            <motion.div
              key="ai-modal"
              data-core-ai-ignore-overlay
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? '' : 'p-4'}`}
            >
              <motion.div
                className="pointer-events-auto flex overflow-hidden"
                initial={{ opacity: 0, width: 520 }}
                animate={{
                  opacity: 1,
                  width: isFullscreen ? '100vw' : hasPanel ? 900 : 520,
                  borderRadius: isFullscreen ? 0 : 24,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94], opacity: { duration: 0.12 } }}
                style={{
                  maxWidth: isFullscreen ? '100vw' : '95vw',
                  height: isFullscreen ? '100vh' : '85vh',
                  maxHeight: isFullscreen ? '100vh' : '720px',
                  background: t.modalBg,
                  border: isFullscreen ? 'none' : `1px solid ${t.modalBorder}`,
                  boxShadow: isFullscreen ? 'none' : t.modalShadow,
                }}
              >
                {/* ── Left: Chat ── */}
                <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: `1px solid ${t.borderSubtle}` }}>

                  {/* Header */}
                  <div className="flex shrink-0 items-center justify-between px-5 py-4"
                    style={{ background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}` }}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: t.avatarBg, boxShadow: t.avatarGlow }}>
                        <Sparkles className="h-4 w-4 text-white" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400"
                          style={{ border: `2px solid ${t.onlineDotBorder}` }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: t.text }}>Core AI</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: t.badgeBg, color: t.badgeColor, border: `1px solid ${t.badgeBorder}` }}>Beta</span>
                        </div>
                        <p className="text-xs" style={{ color: t.textMuted }}>Your retirement assistant</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setColorMode((m) => m === 'dark' ? 'light' : 'dark')}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.hoverIcon; (e.currentTarget as HTMLButtonElement).style.background = t.hoverIconBg }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.textMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        aria-label="Toggle theme">
                        {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={handleReset}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.hoverIcon; (e.currentTarget as HTMLButtonElement).style.background = t.hoverIconBg }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.textMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        aria-label="New conversation">
                        <History className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setIsFullscreen((f) => !f)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.hoverIcon; (e.currentTarget as HTMLButtonElement).style.background = t.hoverIconBg }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.textMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={closeChat}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.hoverIcon; (e.currentTarget as HTMLButtonElement).style.background = t.hoverIconBg }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = t.textMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        aria-label="Close">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: t.scrollbar }}>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.15) }}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="flex gap-3 max-w-[92%]">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                              style={{ background: t.avatarBg, boxShadow: `0 0 8px ${t.avatarGlow.replace('12px', '8px')}` }}>
                              <Sparkles className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="rounded-2xl rounded-tl-md px-4 py-3"
                                style={{ background: t.msgBubbleBg, border: `1px solid ${t.msgBubbleBorder}`, borderLeft: `2px solid ${t.msgBubbleAccent}` }}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: t.text }}>
                                  {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                                </p>
                              </div>
                              {msg.suggestions && msg.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.suggestions.map((chip) => (
                                    <button key={chip} type="button" onClick={() => sendMessage(chip)}
                                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                                      style={{ border: `1px solid ${t.chipBorder}`, background: t.chipBg, color: t.chipColor }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.chipHoverBg; (e.currentTarget as HTMLButtonElement).style.borderColor = t.chipHoverBorder }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.chipBg; (e.currentTarget as HTMLButtonElement).style.borderColor = t.chipBorder }}>
                                      {chip}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {msg.id !== 'welcome-0' && (
                                <div className="flex items-center gap-0.5 pl-1">
                                  <button type="button" onClick={() => handleCopy(msg.id, msg.content)}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                                    style={{ color: t.textSubtle }} aria-label="Copy">
                                    {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                  <button type="button"
                                    onClick={() => { setLikedIds((p) => { const n = new Set(p); n.add(msg.id); return n }); setDislikedIds((p) => { const n = new Set(p); n.delete(msg.id); return n }) }}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                                    style={{ color: likedIds.has(msg.id) ? '#34d399' : t.textSubtle }} aria-label="Like">
                                    <ThumbsUp className="h-3 w-3" />
                                  </button>
                                  <button type="button"
                                    onClick={() => { setDislikedIds((p) => { const n = new Set(p); n.add(msg.id); return n }); setLikedIds((p) => { const n = new Set(p); n.delete(msg.id); return n }) }}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                                    style={{ color: dislikedIds.has(msg.id) ? '#f87171' : t.textSubtle }} aria-label="Dislike">
                                    <ThumbsDown className="h-3 w-3" />
                                  </button>
                                  <button type="button" onClick={() => isSpeaking ? stop() : speak(msg.content)}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                                    style={{ color: isSpeaking ? t.speakActive : t.textSubtle }} aria-label={isSpeaking ? 'Stop' : 'Read aloud'}>
                                    {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <div className="max-w-[78%] rounded-2xl rounded-tr-md px-4 py-3"
                              style={{ background: t.userBubbleBg, boxShadow: t.userBubbleShadow }}>
                              <p className="text-sm leading-relaxed text-white">{msg.content}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isTyping && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl" style={{ background: t.avatarBg }}>
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1 rounded-2xl rounded-tl-md px-4 py-3"
                          style={{ background: t.msgBubbleBg, border: `1px solid ${t.msgBubbleBorder}` }}>
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: t.typingDot, animationDelay: `${i * 0.12}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="shrink-0 p-4" style={{ borderTop: `1px solid ${t.borderSubtle}` }}>
                    <div className="flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-150"
                      style={{
                        background: t.inputBg,
                        border: `1px solid ${inputFocused ? t.inputFocusBorder : t.inputBorder}`,
                        boxShadow: inputFocused ? t.inputFocusShadow : 'none',
                      }}>
                      {voiceSupported && (
                        <button type="button" onClick={toggleVoice}
                          className="shrink-0 transition-colors"
                          style={{ color: isListening ? '#f87171' : t.textMuted }}
                          aria-label={isListening ? 'Stop listening' : 'Voice input'}>
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      )}
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder={isListening ? 'Listening…' : 'Ask Core AI anything…'}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: t.text }}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                      />
                      <button
                        type="button"
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isTyping}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: t.sendBtnBg }}
                        aria-label="Send">
                        <Send className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                    <p className="mt-2 text-center text-[10px]" style={{ color: t.discordText }}>
                      Core AI can make mistakes. Please verify important information.
                    </p>
                  </div>
                </div>

                {/* ── Right: Interactive Panel ── */}
                <AnimatePresence>
                  {hasPanel && (
                    <motion.div
                      key="right-panel"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 380, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="shrink-0 overflow-hidden"
                      style={{ minWidth: 0 }}>
                      <div className="flex flex-col h-full" style={{ width: 380, minWidth: 380, background: t.rightPanelBg, borderLeft: `1px solid ${t.border}` }}>
                        <div style={{ height: 2, flexShrink: 0, background: t.accentBar }} />
                        {activePanelMsg?.flowStep && (
                          <StepIndicator current={activePanelMsg.flowStep.current} total={activePanelMsg.flowStep.total} label={activePanelMsg.flowStep.label} />
                        )}
                        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin', scrollbarColor: t.scrollbar }}>
                          <AnimatePresence mode="wait">
                            {activePanelMsg && (
                              <motion.div
                                key={activePanelMsg.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}>
                                <InteractivePanel msg={activePanelMsg} onStructured={handleStructured} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ThemeCtx.Provider>
  )
}

export default CoreAIPanel
