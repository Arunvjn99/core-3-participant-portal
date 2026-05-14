import React, { createContext, useContext } from 'react'
const RadioCtx = createContext<{ value: string; onChange: (v: string) => void }>({ value: '', onChange: () => {} })
interface RadioGroupProps { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }
export function RadioGroup({ value, onValueChange, children, className = '' }: RadioGroupProps) {
  return <RadioCtx.Provider value={{ value, onChange: onValueChange }}><div className={className}>{children}</div></RadioCtx.Provider>
}
interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
  /** Merged after base radio styles so callers can tune colors (e.g. loan flow). */
  style?: React.CSSProperties
}
export function RadioGroupItem({ value, id, className = '', style }: RadioGroupItemProps) {
  const ctx = useContext(RadioCtx)
  const baseStyle: React.CSSProperties = {
    borderColor: ctx.value === value ? 'var(--brand-primary)' : 'var(--c-text-faint)',
    background: ctx.value === value ? 'var(--brand-primary)' : 'var(--c-card)',
  }
  return (
    <button type="button" id={id} onClick={() => ctx.onChange(value)}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${className}`}
      style={{ ...baseStyle, ...style }}
    >
      {ctx.value === value && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-900" />}
    </button>
  )
}
