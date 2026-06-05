const CORE_LOGO_SVG =
  'https://vrivhbghtffppkezvkfg.supabase.co/storage/v1/object/public/Logo%20and%20images/CORE%20Logo%20sup.svg'

interface CoreLogoProps {
  className?: string
  alt?: string
}

// dark:invert flips the logo for dark backgrounds since the SVG has a dark-coloured mark
export default function CoreLogo({ className = 'h-8 w-auto object-contain', alt = 'CORE' }: CoreLogoProps) {
  return (
    <img
      src={CORE_LOGO_SVG}
      alt={alt}
      className={`dark:invert ${className}`}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}
