export function Separator({ className = '', orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return orientation === 'horizontal'
    ? <div className={`h-px w-full bg-gray-200 dark:bg-gray-700 ${className}`} />
    : <div className={`w-px self-stretch bg-gray-200 dark:bg-gray-700 ${className}`} />
}

export default Separator
