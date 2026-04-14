import React from 'react'
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export function Card({ children, className = '', style, ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}
