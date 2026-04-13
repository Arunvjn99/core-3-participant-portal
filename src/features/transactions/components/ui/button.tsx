import React from 'react'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: string; size?: string }
export function Button({ children, className = '', style, ...props }: ButtonProps) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${className}`} style={style} {...props}>{children}</button>
}
