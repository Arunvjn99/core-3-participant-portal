import {
  ArrowLeftRight,
  Bell,
  ChartLine,
  ChartNoAxesCombined,
  CircleHelp,
  CircleUserRound,
  FileText,
  HandCoins,
  House,
  Link2,
  Settings,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/**
 * The portal's icon system: Lucide outline icons only, one stroke weight, a few fixed sizes, and a soft neutral
 * tile behind primary shortcut icons. Everything that draws an icon should take its values from here.
 */

/** One stroke weight everywhere, so icons never look heavier in one place than another */
export const ICON_STROKE = 1.75

/** Icon sizes in px. `shortcut` sits in a tile on a dashboard card; `secondary` is buttons, actions and the
 *  desktop header; `item` is a row in a menu or drawer; `inline` sits beside small text (ratings, captions);
 *  `nav` is mobile bottom navigation. */
export const ICON_SIZE = {
  inline: 16,
  secondary: 18,
  item: 20,
  shortcut: 22,
  nav: 24,
} as const
export type IconSize = keyof typeof ICON_SIZE

/** Tile sizes: container px and corner radius. 44px is the smallest tile (and the minimum touch target);
 *  52px is for the one tile that leads a card, such as the advisor. */
export const ICON_TILE = {
  md: { box: 'h-11 w-11', radius: 'rounded-[12px]', icon: 20 },
  lg: { box: 'h-[52px] w-[52px]', radius: 'rounded-[14px]', icon: 22 },
} as const
export type IconTileSize = keyof typeof ICON_TILE

/**
 * Colour tokens as Tailwind classes, each with its dark-mode pair.
 * - tile: soft neutral #F1F5F9 behind shortcut icons (a faint white wash in dark mode)
 * - active: brand blue #2563EB, for selected items and the icon inside a tile (4.7:1 on #F1F5F9)
 * - muted: slate for inactive and decorative icons (4.8:1 on white, so it clears the 3:1 non-text minimum)
 */
export const ICON_COLOR = {
  tile: 'bg-[#F1F5F9] dark:bg-white/[0.08]',
  active: 'text-[#2563EB] dark:text-blue-300',
  muted: 'text-slate-500 dark:text-slate-400',
} as const

/** Soft tinted tiles, for the rare place where icons must be told apart by colour (each still has a label).
 *  `neutral` is the default #F1F5F9 tile. */
export const ICON_TILE_TONE = {
  neutral: `${ICON_COLOR.tile} ${ICON_COLOR.active}`,
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
} as const
export type IconTileTone = keyof typeof ICON_TILE_TONE

/** What each feature is drawn with, so the same feature looks the same on every screen */
export const APP_ICONS = {
  home: House,
  balance: Wallet,
  investments: ChartNoAxesCombined,
  transactions: ArrowLeftRight,
  contributions: HandCoins,
  goals: Target,
  projections: ChartLine,
  coreAi: Sparkles,
  notifications: Bell,
  beneficiaries: UsersRound,
  linkedAccounts: Link2,
  advisor: UserRoundCheck,
  help: CircleHelp,
  documents: FileText,
  profile: CircleUserRound,
  settings: Settings,
} as const satisfies Record<string, LucideIcon>
export type AppIconName = keyof typeof APP_ICONS
