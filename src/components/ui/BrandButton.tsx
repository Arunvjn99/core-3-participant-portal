import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, CSSProperties } from 'react'

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', style, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    const baseClasses = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl
      transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
      focus-visible:outline-2 focus-visible:outline-offset-2`

    const variantStyles: Record<'primary' | 'outline' | 'ghost', CSSProperties> = {
      primary: {
        backgroundColor: 'var(--brand-primary)',
        color: '#fff',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--brand-primary)',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: 'var(--brand-primary)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--brand-primary)',
      },
    }

    return (
      <button
        ref={ref}
        {...props}
        type={props.type ?? 'button'}
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
        style={{ ...variantStyles[variant], ...style }}
        onMouseEnter={(e) => {
          props.onMouseEnter?.(e)
          if (variant === 'primary') {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--brand-primary-hover)'
          }
        }}
        onMouseLeave={(e) => {
          props.onMouseLeave?.(e)
          if (variant === 'primary') {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--brand-primary)'
          }
        }}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          children
        )}
      </button>
    )
  },
)
BrandButton.displayName = 'BrandButton'
