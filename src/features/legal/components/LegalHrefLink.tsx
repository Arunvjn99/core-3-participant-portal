import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isExternalUrl } from '@/lib/constants'

type Props = {
  href: string
  className?: string
  style?: CSSProperties
  /** For icon-only links, which have no visible text */
  'aria-label'?: string
  title?: string
  onClick?: () => void
  children: ReactNode
}

/**
 * Uses `<a target="_blank">` for absolute http(s) URLs (e.g. from env), otherwise in-app `<Link>`.
 */
export function LegalHrefLink({ href, children, ...rest }: Props) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  )
}
