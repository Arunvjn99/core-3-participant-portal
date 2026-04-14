import React from 'react'
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export function Label({ children, className = '', ...props }: LabelProps) {
  return <label className={`text-sm font-medium text-gray-700 dark:text-gray-200 ${className}`} {...props}>{children}</label>
}
