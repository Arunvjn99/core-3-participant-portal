import { createContext, useContext, useState, type ReactNode, type CSSProperties } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectCtxType { value: string; onValueChange?: (v: string) => void; open: boolean; setOpen: (v: boolean) => void }
const SelectCtx = createContext<SelectCtxType>({ value: '', open: false, setOpen: () => {} })

interface SelectProps { value?: string; onValueChange?: (v: string) => void; children?: ReactNode; className?: string }
export function Select({ value = '', onValueChange, children, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false)
  return (
    <SelectCtx.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className={`relative ${className}`}>{children}</div>
    </SelectCtx.Provider>
  )
}

export function SelectTrigger({ children, className = '', style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  const { open, setOpen } = useContext(SelectCtx)
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      style={style}
      className={`flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white ${className}`}
    >
      {children}
      <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectCtx)
  return <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{value || placeholder}</span>
}

export function SelectContent({ children, className = '' }: { children?: ReactNode; className?: string }) {
  const { open } = useContext(SelectCtx)
  if (!open) return null
  return (
    <div className={`absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  )
}

export function SelectItem({ value, children, className = '' }: { value: string; children?: ReactNode; className?: string }) {
  const { value: selected, onValueChange, setOpen } = useContext(SelectCtx)
  return (
    <div
      role="option"
      aria-selected={selected === value}
      onClick={() => { onValueChange?.(value); setOpen(false) }}
      className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 ${selected === value ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'} ${className}`}
    >
      {children}
    </div>
  )
}

export default Select
