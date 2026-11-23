import { IconTile } from '@/design-system/icons'
import { ADVISOR } from './advisorProfile'

/** The advisor as an icon (no photo): the system's large shortcut tile with the advisor icon, the same on every card. */
export function AdvisorAvatar({ className }: { className?: string }) {
  return <IconTile name="advisor" size="lg" label={ADVISOR.name} className={className} />
}
