import React, { createContext, useContext, useState } from 'react'
const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} })
interface CollapsibleProps { open?: boolean; onOpenChange?: (v: boolean) => void; defaultOpen?: boolean; children: React.ReactNode; className?: string }
export function Collapsible({ open: controlledOpen, onOpenChange, defaultOpen = false, children, className = '' }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = controlledOpen ?? internalOpen
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v) }
  return <Ctx.Provider value={{ open, setOpen }}><div className={className}>{children}</div></Ctx.Provider>
}
export function CollapsibleTrigger({ children, className = '' }: { children: React.ReactNode; className?: string; asChild?: boolean }) {
  const { open, setOpen } = useContext(Ctx)
  return <div className={`cursor-pointer ${className}`} onClick={() => setOpen(!open)}>{children}</div>
}
export function CollapsibleContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { open } = useContext(Ctx)
  if (!open) return null
  return <div className={className}>{children}</div>
}
