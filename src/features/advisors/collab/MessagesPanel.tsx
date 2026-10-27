import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useAdviser } from './useAdviser'
import { ASSIGNED_ADVISER } from './adviser'

const MAX = 2000

export function MessagesPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const { messages, send, markRead } = useAdviser()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // Opening the thread marks adviser messages as read.
  useEffect(() => {
    markRead()
  }, [markRead, messages.length])

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages.length])

  const fmt = (ms: number) =>
    new Date(ms).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const submit = () => {
    if (!draft.trim()) return
    send(draft)
    setDraft('')
  }

  return (
    <div className="flex flex-col">
      <div className="max-h-[420px] min-h-[260px] space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite" aria-label={t('adviser.messages.thread')}>
        {messages.map((m) => {
          const mine = m.from === 'me'
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                  mine ? 'rounded-br-md bg-primary text-text-inverse' : 'rounded-bl-md border border-border-default bg-surface-elevated text-text-primary',
                )}
              >
                {m.id === 'seed-welcome' ? t('adviser.messages.welcome', { name: ASSIGNED_ADVISER.name.split(' ')[0] }) : m.text}
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                {mine ? t('adviser.messages.you') : ASSIGNED_ADVISER.name} · {fmt(m.at)}
              </p>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form
        className="mt-4 border-t border-border-default pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label htmlFor="adviser-draft" className="sr-only">
          {t('adviser.messages.placeholder')}
        </label>
        <textarea
          id="adviser-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={3}
          placeholder={t('adviser.messages.placeholder')}
          className="w-full resize-none rounded-lg border border-border-default bg-surface-card p-3 text-[13px] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-start gap-1.5 text-[11px] leading-snug text-text-muted">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>{t('adviser.messages.privacy')}</span>
          </p>
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-text-inverse transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {t('adviser.messages.send')}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">{t('adviser.messages.response_time')}</p>
      </form>
    </div>
  )
}
