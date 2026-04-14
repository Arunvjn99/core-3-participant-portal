interface SliderProps { value: number[]; onValueChange: (v: number[]) => void; min?: number; max?: number; step?: number; className?: string }
export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }: SliderProps) {
  const pct = ((value[0] - min) / (max - min)) * 100
  return (
    <div className={`relative flex items-center ${className}`} style={{ height: 20 }}>
      <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-gray-700">
        <div
          className="absolute h-full rounded-full"
          style={{ backgroundColor: 'var(--brand-primary)', width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value[0]}
        onChange={e => onValueChange([+e.target.value])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ zIndex: 1 }}
      />
      <div
        className="absolute rounded-full border-2 border-white dark:border-gray-900 shadow-sm"
        style={{
          width: 20, height: 20,
          backgroundColor: 'var(--brand-primary)',
          left: `calc(${pct}% - 10px)`,
          boxShadow: '0 0 0 3px var(--brand-primary-ring)',
        }}
      />
    </div>
  )
}
