interface CheckboxProps { id?: string; checked?: boolean; onCheckedChange?: (v: boolean) => void; className?: string }
export function Checkbox({ id, checked, onCheckedChange, className = '' }: CheckboxProps) {
  return (
    <button type="button" id={id} onClick={() => onCheckedChange?.(!checked)} role="checkbox" aria-checked={checked}
      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${className}`}
      style={{ borderColor: checked ? 'var(--brand-primary)' : 'var(--c-text-faint)', background: checked ? 'var(--brand-primary)' : 'var(--c-card)' }}
    >
      {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </button>
  )
}
