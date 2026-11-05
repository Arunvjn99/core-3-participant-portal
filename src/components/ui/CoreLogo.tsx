import { useId } from 'react'

interface CoreLogoProps {
  className?: string
  alt?: string
}

/**
 * EverVest logo: a blue rounded tile with a white four-point star through it, then the wordmark.
 * Drawn as vectors so it stays sharp at any size; the wordmark follows the text color, so it reads on light and dark surfaces.
 */
export default function CoreLogo({ className = 'h-8 w-auto', alt = 'EverVest' }: CoreLogoProps) {
  const clip = `evervest-tile-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 140 32" role="img" aria-label={alt} className={`text-text-primary ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clip}>
          <rect x="1" y="1" width="30" height="30" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="1" y="1" width="30" height="30" fill="#1A56FF" />
        {/* Pinwheel star: its tips run out through the four corners */}
        <path
          d="M0 0.5 L20.6 9.4 Q21.3 9.7 21.9 9.2 L31.5 0 L22.6 20.6 Q22.3 21.3 22.8 21.9 L32 31.5 L11.4 22.6 Q10.7 22.3 10.1 22.8 L0.5 32 L9.4 11.4 Q9.7 10.7 9.2 10.1 Z"
          fill="#fff"
        />
      </g>
      <text
        x="40"
        y="24.5"
        fill="currentColor"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="23"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        EverVest
      </text>
    </svg>
  )
}
