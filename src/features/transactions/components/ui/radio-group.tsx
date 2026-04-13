import React, { createContext, useContext } from 'react'
const RadioCtx = createContext<{ value: string; onChange: (v: string) => void }>({ value: '', onChange: () => {} })
interface RadioGroupProps { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }
export function RadioGroup({ value, onValueChange, children, className = '' }: RadioGroupProps) {
  return <RadioCtx.Provider value={{ value, onChange: onValueChange }}><div className={className}>{children}</div></RadioCtx.Provider>
}
interface RadioGroupItemProps { value: string; id?: string; className?: string }
export function RadioGroupItem({ value, id, className = '' }: RadioGroupItemProps) {
  const ctx = useContext(RadioCtx)
  return (
    <button type="button" id={id} onClick={() => ctx.onChange(value)}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${className}`}
      style={{ borderColor: ctx.value === value ? '#2563EB' : '#CBD5E1', background: ctx.value === value ? '#2563EB' : '#fff' }}
    >
      {ctx.value === value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
    </button>
  )
}
