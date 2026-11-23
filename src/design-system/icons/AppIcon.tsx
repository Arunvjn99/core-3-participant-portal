import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { APP_ICONS, ICON_SIZE, ICON_STROKE, ICON_TILE, ICON_TILE_TONE, type AppIconName, type IconSize, type IconTileSize, type IconTileTone } from './iconTokens'

type IconSource = { name: AppIconName; icon?: never } | { icon: LucideIcon; name?: never }

/**
 * A Lucide icon at one of the system sizes and the system stroke. Decorative by default (hidden from screen
 * readers); pass `label` when the icon is the only thing that says what something is.
 */
export function AppIcon({ name, icon, size = 'secondary', label, className }: IconSource & { size?: IconSize; label?: string; className?: string }) {
  const Icon = icon ?? APP_ICONS[name as AppIconName]
  const px = ICON_SIZE[size]
  return (
    <Icon
      width={px}
      height={px}
      strokeWidth={ICON_STROKE}
      absoluteStrokeWidth
      className={cn('shrink-0', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  )
}

/**
 * A primary shortcut icon on its soft neutral tile: a rounded square, brand-blue icon, no border, shadow or
 * gradient. Use it only where an icon leads a card or a shortcut; everywhere else use a plain `AppIcon`.
 */
export function IconTile({ name, icon, size = 'md', tone = 'neutral', label, className }: IconSource & { size?: IconTileSize; tone?: IconTileTone; label?: string; className?: string }) {
  const Icon = icon ?? APP_ICONS[name as AppIconName]
  const tile = ICON_TILE[size]
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center', tile.box, tile.radius, ICON_TILE_TONE[tone], className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon width={tile.icon} height={tile.icon} strokeWidth={ICON_STROKE} absoluteStrokeWidth aria-hidden />
    </span>
  )
}
