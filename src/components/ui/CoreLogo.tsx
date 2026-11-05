interface CoreLogoProps {
  className?: string
  alt?: string
}

/**
 * Neutral placeholder logo shown wherever the product mark appears (header, footer, sign-in pages).
 * Swap this one component for the real brand mark when it is ready.
 */
export default function CoreLogo({ className = 'h-8 w-auto', alt = 'Logo' }: CoreLogoProps) {
  return (
    <svg
      viewBox="0 0 104 32"
      role="img"
      aria-label={alt}
      className={`text-text-primary ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="2" width="28" height="28" rx="8" fill="var(--brand-primary, #2563eb)" />
      <circle cx="11" cy="12" r="4" fill="#fff" opacity="0.95" />
      <path d="M7 24 L14 17 L18 20.5 L23 15 L23 24 Z" fill="#fff" opacity="0.7" />
      <text
        x="38"
        y="22"
        fill="currentColor"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="17"
        fontWeight="700"
        letterSpacing="0.06em"
      >
        LOGO
      </text>
    </svg>
  )
}
