import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Info, Sparkles, X } from 'lucide-react'
import { useAIStore } from '@/core/store/aiStore'
import { termBody, termQuestion, termTitle, type TermId } from './glossary'

const WIDTH = 288
const GUTTER = 16

/**
 * A small ⓘ next to a term. Opens a plain-language definition, with a link to ask CORE AI for more.
 * The popover is portalled and fixed-positioned so tables and cards with overflow don't clip it.
 */
export function TermInfo({ term, className }: { term: TermId; className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean }>({ top: 0, left: 0, above: false })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const title = termTitle(term)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const h = popRef.current?.offsetHeight ?? 180
    const above = r.bottom + 8 + h > window.innerHeight && r.top - 8 - h > 0
    const left = Math.min(Math.max(GUTTER, r.left + r.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - GUTTER)
    setPos({ top: above ? r.top - 8 - h : r.bottom + 8, left, above })
    popRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!popRef.current?.contains(target) && !btnRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const ask = () => {
    setOpen(false)
    useAIStore.getState().askAI(termQuestion(term))
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={t('glossary.info_label', { term: title })}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full align-middle before:absolute before:-inset-3 before:content-[''] text-gray-400 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-400 ${className ?? ''}`}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label={title}
            tabIndex={-1}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: WIDTH, zIndex: 60 }}
            className="rounded-xl border border-gray-200 bg-white p-4 text-left normal-case tracking-normal shadow-xl focus:outline-none dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-gray-900 dark:text-white" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{title}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('glossary.close')} className="-mr-1 -mt-1 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-gray-600 dark:text-gray-300" style={{ fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 400 }}>{termBody(term)}</p>
            <button type="button" onClick={ask} className="mt-3 inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('glossary.ask_ai')}
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
