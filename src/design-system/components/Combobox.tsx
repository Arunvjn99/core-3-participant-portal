import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface ComboboxOption {
  value: string
  label: string
  /** Short note shown on the right of the option, e.g. "No state tax" */
  meta?: string
}

export interface ComboboxProps {
  id: string
  value: string
  options: ComboboxOption[]
  onChange: (value: string) => void
  /** Shown when typing matches nothing */
  emptyText: string
  className?: string
  'aria-describedby'?: string
}

const LIST_MAX = 264 // px, about seven rows

/**
 * A searchable dropdown styled like the portal's own fields (the native select on macOS opens as a full-height grey
 * sheet). Type to filter, arrow keys to move, Enter to pick, Escape to close. Opens upward when there is no room below.
 */
export function Combobox({ id, value, options, onChange, emptyText, className, ...aria }: ComboboxProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [up, setUp] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)

  // Names starting with the text come first, then names containing it
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    const starts = options.filter((o) => o.label.toLowerCase().startsWith(q))
    const has = options.filter((o) => !o.label.toLowerCase().startsWith(q) && o.label.toLowerCase().includes(q))
    return [...starts, ...has]
  }, [options, query])

  const openList = (q = '') => {
    if (open) return
    const r = box.current?.getBoundingClientRect()
    if (r) setUp(window.innerHeight - r.bottom < LIST_MAX + 16 && r.top > window.innerHeight - r.bottom)
    setQuery(q)
    setActive(q ? 0 : Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const pick = (o: ComboboxOption) => {
    onChange(o.value)
    close()
    input.current?.focus()
  }

  // Closes on a click outside
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && close()
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keeps the highlighted option in view
  useEffect(() => {
    if (!open) return
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, shown])

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => Math.min(shown.length - 1, Math.max(0, i + step)))
    } else if (e.key === 'Home' && open) {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End' && open) {
      e.preventDefault()
      setActive(shown.length - 1)
    } else if (e.key === 'Enter') {
      if (!open) return
      e.preventDefault()
      if (shown[active]) pick(shown[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab' && open) {
      close()
    }
  }

  return (
    <div ref={box} className={cn('relative', className)}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400" aria-hidden>
          {open ? <Search className="h-4 w-4" /> : null}
        </span>
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          aria-describedby={aria['aria-describedby']}
          autoComplete="off"
          spellCheck={false}
          value={open ? query : selected?.label ?? ''}
          placeholder={selected?.label}
          onChange={(e) => {
            if (open) {
              setQuery(e.target.value)
              setActive(0)
              return
            }
            // Typing while closed starts a new search rather than adding to the shown name
            const text = e.target.value
            const label = selected?.label ?? ''
            openList(label && text.startsWith(label) ? text.slice(label.length) : text)
          }}
          onClick={() => openList()}
          onKeyDown={onKey}
          className={cn(
            'h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white pr-10 text-[15px] text-text-primary transition-colors placeholder:text-slate-400 focus:cursor-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-400/30',
            open ? 'pl-10' : 'pl-3.5',
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) close()
            else {
              openList()
              input.current?.focus()
            }
          }}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 dark:text-slate-300"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          style={{ maxHeight: LIST_MAX }}
          className={cn(
            'absolute left-0 right-0 z-30 overflow-y-auto overscroll-contain rounded-xl bg-white p-1.5 shadow-[0_24px_48px_-20px_rgba(11,21,51,0.4)] ring-1 ring-slate-200/80 dark:bg-[#0B1436] dark:ring-white/10',
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {shown.length === 0 ? (
            <li className="px-3 py-2.5 text-[14px] text-slate-500 dark:text-slate-400">{emptyText}</li>
          ) : (
            shown.map((o, i) => {
              const on = o.value === value
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={on}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-text-primary',
                    i === active && 'bg-slate-100 dark:bg-white/10',
                    on && 'font-semibold text-primary dark:text-blue-300',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.meta && <span className="shrink-0 text-[12px] font-normal text-slate-500 dark:text-slate-400">{o.meta}</span>}
                  {on && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
