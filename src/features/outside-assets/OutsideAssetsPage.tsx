import { useMemo, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Briefcase, CreditCard, HandCoins, Home, Landmark, PiggyBank, Plus, Scale, SlidersHorizontal, TrendingUp, Wallet } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import {
  BODY_TEXT, Card, CARD_TITLE, DIVIDE, HEADING, IconChip, MUTED_TEXT, PILL_PRIMARY, RULE, SECTION_LABEL, StepHeader, TEXT_LINK, TitleBadge,
  type BadgeTone,
} from '@/features/enrollment/enrollmentUi'
import type { AccountType, LinkedAccount } from './linkService'
import { useOutsideAssetsStore } from './outsideAssetsStore'
import { ACCOUNT_GROUPS, ASSET_SLICES, PLAN_ACCOUNT, formatMoney, groupOf, summarize, type AccountGroup, type AssetSlice } from './summary'
import { AddAccountDialog, EditBalanceDialog, RemoveAccountDialog } from './AccountDialogs'
import { accountName } from './summary'

type IconType = ComponentType<{ className?: string }>

const TYPE_ICON: Record<AccountType, IconType> = {
  retirement_401k: Briefcase,
  ira: PiggyBank,
  roth_ira: PiggyBank,
  brokerage: TrendingUp,
  savings: Landmark,
  checking: Wallet,
  property: Home,
  mortgage: Home,
  loan: HandCoins,
  credit_card: CreditCard,
}

const GROUP_TONE: Record<AccountGroup, BadgeTone> = { retirement: 'blue', assets: 'slate', debts: 'amber' }

/** The dashboard's allocation colours, so the two bars read as one family in light and dark. */
const SLICE_COLOR: Record<AssetSlice, string> = {
  plan: 'var(--chart-blue)',
  retirement: 'var(--chart-teal)',
  cash: 'var(--chart-green-dark)',
  property: 'var(--chart-amber)',
}

const ROW_ACTION = 'rounded px-1 py-1 text-xs font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'

export default function OutsideAssetsPage() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const accounts = useOutsideAssetsStore((s) => s.accounts)

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<LinkedAccount | null>(null)
  const [removing, setRemoving] = useState<LinkedAccount | null>(null)
  /** Read out by screen readers after an add, an update or a removal. */
  const [notice, setNotice] = useState('')

  const summary = useMemo(() => summarize(accounts), [accounts])
  const money = (v: number) => formatMoney(v, locale)
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })

  const slices = ASSET_SLICES.map((id) => ({ id, value: summary.slices[id], label: t(`outside_assets.slice.${id}`) })).filter((s) => s.value > 0)
  const share = (value: number) => (summary.totalAssets > 0 ? Math.round((value / summary.totalAssets) * 100) : 0)

  const groups = ACCOUNT_GROUPS.map((id) => {
    const rows = accounts.filter((a) => groupOf(a.type) === id)
    const subtotal = rows.reduce((s, a) => s + a.balance, 0) + (id === 'retirement' ? summary.planBalance : 0)
    return { id, rows, subtotal }
  }).filter((g) => g.id === 'retirement' || g.rows.length > 0)

  const addButton = (
    <button type="button" onClick={() => setAdding(true)} className={PILL_PRIMARY}>
      <Plus className="h-4 w-4" aria-hidden />
      {t('outside_assets.add')}
    </button>
  )

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-surface-page">
        <div className="mx-auto max-w-[960px] space-y-5 px-4 pb-24 pt-6 sm:px-6 lg:pt-7">
          <StepHeader title={t('outside_assets.title')} subtitle={t('outside_assets.subtitle')} aside={accounts.length > 0 ? addButton : undefined} />

          <p role="status" className="sr-only">{notice}</p>

          {accounts.length === 0 ? (
            /* Nothing linked yet: say what linking gives, with one way forward */
            <Card tone="blue">
              <div className="flex items-start gap-3.5">
                <TitleBadge Icon={Landmark} />
                <div className="min-w-0">
                  <h2 className={CARD_TITLE}>{t('outside_assets.empty.title')}</h2>
                  <p className={cn('mt-1 max-w-xl text-sm leading-relaxed', BODY_TEXT)}>
                    {t('outside_assets.empty.body', { balance: money(summary.planBalance) })}
                  </p>
                </div>
              </div>
              <ul className={cn('mt-5 grid grid-cols-1 gap-y-4 border-t pt-5 sm:grid-cols-3 sm:gap-x-6', RULE)}>
                {([
                  ['retirement', PiggyBank],
                  ['net_worth', Scale],
                  ['control', SlidersHorizontal],
                ] as const).map(([key, Icon]) => (
                  <li key={key} className="flex items-start gap-3">
                    <IconChip Icon={Icon} small />
                    <div className="min-w-0">
                      <p className={cn('text-sm font-semibold', HEADING)}>{t(`outside_assets.empty.${key}_title`)}</p>
                      <p className={cn('mt-0.5 text-[13px] leading-snug', BODY_TEXT)}>{t(`outside_assets.empty.${key}_body`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                {addButton}
                <p className={cn('text-xs', MUTED_TEXT)}>{t('outside_assets.empty.cta_note')}</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Summary: the two totals, then what the assets are made of */}
              <Card tone="blue">
                <dl className={cn('grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0', DIVIDE)}>
                  <div className="pb-5 sm:pb-0 sm:pr-6">
                    <dt className={SECTION_LABEL}>{t('outside_assets.total_retirement')}</dt>
                    <dd className={cn('mt-1 text-[32px] font-bold leading-none tracking-tight tabular-nums', HEADING)}>{money(summary.totalRetirement)}</dd>
                    <dd className={cn('mt-2 text-xs', MUTED_TEXT)}>
                      {t('outside_assets.total_retirement_note', { plan: money(summary.planBalance), outside: money(summary.outsideRetirement) })}
                    </dd>
                  </div>
                  <div className="pt-5 sm:pl-6 sm:pt-0">
                    <dt className={SECTION_LABEL}>{t('outside_assets.net_worth')}</dt>
                    <dd className={cn('mt-1 text-[32px] font-bold leading-none tracking-tight tabular-nums', HEADING)}>{money(summary.netWorth)}</dd>
                    <dd className={cn('mt-2 text-xs', MUTED_TEXT)}>
                      {t('outside_assets.net_worth_note', { assets: money(summary.totalAssets), debts: money(summary.totalDebts) })}
                    </dd>
                  </div>
                </dl>

                <div className={cn('mt-5 border-t pt-4', RULE)}>
                  <p className={SECTION_LABEL} id="outside-assets-mix">{t('outside_assets.mix_label')}</p>
                  <div className="mt-2.5 flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
                    {slices.map((s) => (
                      <div key={s.id} className="min-w-[4px]" style={{ flexGrow: s.value, flexBasis: 0, backgroundColor: SLICE_COLOR[s.id] }} />
                    ))}
                  </div>
                  <ul aria-labelledby="outside-assets-mix" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    {slices.map((s) => (
                      <li key={s.id} className="min-w-0">
                        <p className={cn('flex items-center gap-1.5 text-xs font-medium', BODY_TEXT)}>
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: SLICE_COLOR[s.id] }} aria-hidden />
                          {s.label}
                        </p>
                        <p className={cn('mt-0.5 text-sm font-bold tabular-nums', HEADING)}>
                          {money(s.value)} <span className={cn('font-medium', MUTED_TEXT)}>{share(s.value)}%</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Accounts: one card, groups split by hairlines */}
              <Card>
                <h2 className={CARD_TITLE}>{t('outside_assets.accounts_title')}</h2>
                {groups.map((group) => (
                  <section key={group.id} aria-labelledby={`outside-assets-${group.id}`} className={cn('mt-4 border-t pt-4', RULE)}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 id={`outside-assets-${group.id}`} className={SECTION_LABEL}>{t(`outside_assets.group.${group.id}`)}</h3>
                      <p className={cn('text-sm font-bold tabular-nums', HEADING)}>{money(group.subtotal)}</p>
                    </div>
                    <ul className={cn('mt-1 divide-y', DIVIDE)}>
                      {group.id === 'retirement' && (
                        <li className="flex gap-3 py-3.5 last:pb-0">
                          <IconChip Icon={Briefcase} tone="blue" small />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className={cn('min-w-0 text-sm font-semibold', HEADING)}>{PLAN_ACCOUNT.name}</p>
                              <p className={cn('shrink-0 text-sm font-bold tabular-nums', HEADING)}>{money(summary.planBalance)}</p>
                            </div>
                            <p className={cn('mt-0.5 text-xs', MUTED_TEXT)}>{t('outside_assets.this_plan')}</p>
                          </div>
                        </li>
                      )}
                      {group.rows.map((a) => {
                        const name = accountName(a, t)
                        return (
                          <li key={a.id} className="flex gap-3 py-3.5 last:pb-0">
                            <IconChip Icon={TYPE_ICON[a.type]} tone={GROUP_TONE[group.id]} small />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <p className={cn('min-w-0 break-words text-sm font-semibold', HEADING)}>{name}</p>
                                <p className={cn('shrink-0 text-sm font-bold tabular-nums', HEADING)}>{money(a.balance)}</p>
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3">
                                <p className={cn('text-xs', MUTED_TEXT)}>
                                  {t(`outside_assets.type.${a.type}`)} · {t(`outside_assets.source.${a.source}`)} · {t('outside_assets.updated', { date: shortDate(a.updatedAt) })}
                                </p>
                                <div className="-mr-1 flex gap-2">
                                  {a.source === 'manual' && (
                                    <button
                                      type="button"
                                      onClick={() => setEditing(a)}
                                      aria-label={t('outside_assets.edit_aria', { name })}
                                      className={cn(ROW_ACTION, TEXT_LINK, 'text-xs')}
                                    >
                                      {t('outside_assets.edit')}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setRemoving(a)}
                                    aria-label={t('outside_assets.remove_aria', { name })}
                                    className={cn(ROW_ACTION, 'text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400')}
                                  >
                                    {t('outside_assets.remove')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </Card>
            </>
          )}
        </div>
      </div>

      <AddAccountDialog open={adding} onClose={() => setAdding(false)} onAdded={(name) => setNotice(t('outside_assets.notice_added', { name }))} />
      <EditBalanceDialog account={editing} onClose={() => setEditing(null)} onSaved={(name) => setNotice(t('outside_assets.notice_updated', { name }))} />
      <RemoveAccountDialog account={removing} onClose={() => setRemoving(null)} onRemoved={(name) => setNotice(t('outside_assets.notice_removed', { name }))} />
    </AnimatedPage>
  )
}
