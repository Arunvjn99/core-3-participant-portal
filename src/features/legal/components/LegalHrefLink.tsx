import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isExternalUrl } from '@/lib/constants'

type Props = {
  href: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Uses `<a target="_blank">` for absolute http(s) URLs (e.g. from env), otherwise in-app `<Link>`.
 */
export function LegalHrefLink({ href, className, style, children }: Props) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className} style={style}>
      {children}
    </Link>
  )
}
