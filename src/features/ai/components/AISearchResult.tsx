import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../design-system/components/Badge'
import { cn } from '../../../lib/cn'

export interface AISearchResultProps {
  title: string
  subtitle: string
  category: string
  href: string
  onPick: () => void
}

export function AISearchResult({ title, subtitle, category, href, onPick }: AISearchResultProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => {
        navigate(href)
        onPick()
      }}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border border-border-default bg-surface-card px-4 py-3 text-left transition-colors hover:border-border-focus hover:bg-surface-page'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{subtitle}</p>
      </div>
      <Badge variant="default" className="shrink-0 capitalize">
        {category}
      </Badge>
    </button>
  )
}

export default AISearchResult
