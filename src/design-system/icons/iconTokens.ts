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

/** Tile sizes: a circle, container px and icon px. `sm` sits beside a card title; 44px is the smallest tile that is
 *  also a touch target; 52px is for the one tile that leads a card, such as the advisor. */
export const ICON_TILE = {
  sm: { box: 'h-9 w-9', radius: 'rounded-full', icon: 18 },
  md: { box: 'h-11 w-11', radius: 'rounded-full', icon: 20 },
  lg: { box: 'h-[52px] w-[52px]', radius: 'rounded-full', icon: 22 },
} as const
export type IconTileSize = keyof typeof ICON_TILE

/**
 * Colour tokens as Tailwind classes, each with its dark-mode pair.
 * - tile: light brand blue (#DBEAFE) behind icons, so a title icon reads as a distinct chip; a blue wash in dark mode
 * - active: brand blue #1D4ED8, for selected items and the icon inside a tile (5.6:1 on #DBEAFE)
 * - muted: slate for inactive and decorative icons (4.8:1 on white, so it clears the 3:1 non-text minimum)
 */
export const ICON_COLOR = {
  tile: 'bg-blue-100 dark:bg-blue-500/25',
  active: 'text-blue-700 dark:text-blue-200',
  muted: 'text-slate-500 dark:text-slate-400',
} as const

/** Soft tinted tiles, for the rare place where icons must be told apart by colour (each still has a label).
 *  `neutral` is the default subtle blue tile. */
export const ICON_TILE_TONE = {
  neutral: `${ICON_COLOR.tile} ${ICON_COLOR.active}`,
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/25 dark:text-violet-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200',
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
