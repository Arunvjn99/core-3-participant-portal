import { useEffect, useState, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ClipboardList,
  ArrowLeftRight,
  TrendingUp,
  User,
  Search,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Globe,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_MENU_LANGS, type LanguageMenuLang } from '@/core/i18n'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { useTheme } from '@/core/hooks/useTheme'
import { useAIStore } from '@/core/store/aiStore'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useBrandTheme } from '@/core/theme/BrandThemeContext'
import AppFooter from '@/features/dashboard/components/AppFooter'
import { supabase } from '@/core/supabase'
import { ROUTES } from '@/lib/constants'

function getNavItems(isEnrolled: boolean) {
  return [
    {
      labelKey: isEnrolled ? 'nav.post_enrollment_dashboard' : 'nav.pre_enrollment_dashboard',
      href: isEnrolled ? ROUTES.POST_ENROLLMENT_DASHBOARD : ROUTES.PRE_ENROLLMENT_DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      labelKey: 'nav.enrollment',
      href: isEnrolled ? '/enrollment/manage' : '/enrollment/plan',
      icon: ClipboardList,
    },
    { labelKey: 'nav.transactions', href: '/transactions', icon: ArrowLeftRight },
    { labelKey: 'nav.investments', href: '/investments', icon: TrendingUp },
    { labelKey: 'nav.profile', href: '/profile', icon: User },
  ]
}

function isNavActive(href: string, pathname: string): boolean {
  if (href === ROUTES.PRE_ENROLLMENT_DASHBOARD || href === ROUTES.POST_ENROLLMENT_DASHBOARD) {
    return pathname === href || pathname === ROUTES.DASHBOARD
  }
  if (href === '/enrollment/plan' || href === '/enrollment/manage')
    return pathname.startsWith('/enrollment')
  return pathname.startsWith(href)
}

const HEADER_NOTIFICATIONS = [
  {
    id: 'loan',
    titleKey: 'nav.notification_loan_title',
    descKey: 'nav.notification_loan_desc',
    href: '/transactions/loan/documents',
  },
  {
    id: 'stmt',
    titleKey: 'nav.notification_stmt_title',
    descKey: 'nav.notification_stmt_desc',
    href: '/transactions',
  },
] as const

export function AppShell() {
  const { theme } = useBrandTheme()
  const { signOut, user } = useAuth()
  const { profile } = useUser()
  const { resolvedMode, setMode } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const toggleSearch = useAIStore((s) => s.toggleSearch)
  const openChat = useAIStore((s) => s.openChat)
  const enrollmentStatus = useEnrollmentDraftStore((s) => s.enrollmentStatus)
  const navItems = getNavItems(enrollmentStatus === 'complete')
  const [userDisplayName, setUserDisplayName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadDisplayName() {
      if (!supabase) {
        setUserDisplayName(user?.email?.split('@')[0] || '')
        return
      }
      const {
        data: { user: u },
      } = await supabase.auth.getUser()
      if (!u) return
      const meta = u.user_metadata as Record<string, string | undefined> | undefined
      const fullName =
        meta?.full_name ||
        `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() ||
        u.email?.split('@')[0] ||
        'User'
      setUserDisplayName(fullName)
    }
    void loadDisplayName()
  }, [user?.email])

  const initials =
    profile?.full_name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'U'

  const avatarInitials = userDisplayName
    ? userDisplayName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : initials

  const avatarLetter = (avatarInitials || initials || 'U').slice(0, 1).toUpperCase()
  const menuLang: LanguageMenuLang =
    ((i18n.language || 'en').split('-')[0] || 'en') === 'es' ? 'es' : 'en'

  const handleSignOut = async () => {
    useEnrollmentDraftStore.getState().resetEnrollment()
    try {
      const p = useEnrollmentDraftStore.persist
      if (p?.clearStorage) {
        await Promise.resolve(p.clearStorage())
      }
    } catch {
      /* ignore */
    }
    await signOut()
    navigate('/login')
  }

  const toggleTheme = () => setMode(resolvedMode === 'dark' ? 'light' : 'dark')

  const changeLang = (lng: LanguageMenuLang) => {
    void i18n.changeLanguage(lng)
    setLangMenuOpen(false)
  }

  useEffect(() => {
    setUserMenuOpen(false)
    setLangMenuOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [userMenuOpen])

  useEffect(() => {
    if (!langMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [langMenuOpen])

  useEffect(() => {
    if (!userMenuOpen && !langMenuOpen && !notificationsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setLangMenuOpen(false)
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userMenuOpen, langMenuOpen, notificationsOpen])

  useEffect(() => {
    if (!notificationsOpen) return
    const onClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [notificationsOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSearch])

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-surface-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 shrink-0 items-center gap-2.5">
              {theme.companyLogo ? (
                <img
                  src={theme.companyLogo}
                  alt={theme.companyName}
                  className="h-8 max-w-[100px] w-auto object-contain"
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {theme.companyName.charAt(0)}
                </div>
              )}
              <span className="hidden max-w-[120px] truncate text-sm font-bold text-text-primary sm:block">
                {theme.companyName}
              </span>
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
              {navItems.map((item) => {
                const active = isNavActive(item.href, location.pathname)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    data-brand-nav-active={active ? '' : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                      active
                        ? ''
                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary dark:hover:text-text-primary'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={toggleSearch}
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated sm:flex"
                aria-label={t('nav.open_search')}
              >
                <Search className="h-4 w-4" />
              </button>
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((prev) => {
                      const next = !prev
                      if (next) setHasUnreadNotifications(false)
                      return next
                    })
                    setLangMenuOpen(false)
                    setUserMenuOpen(false)
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated"
                  aria-label={t('nav.notifications')}
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                >
                  <Bell className="h-4 w-4" />
                  {hasUnreadNotifications && (
                    <span
                      className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-surface-card"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                      aria-hidden
                    />
                  )}
                </button>
                {notificationsOpen && (
                  <div
                    role="dialog"
                    aria-label={t('nav.notifications_title')}
                    className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-dropdown"
                  >
                    <div className="border-b border-border-default px-4 py-3">
                      <p className="text-sm font-semibold text-text-primary">{t('nav.notifications_title')}</p>
                    </div>
                    <ul className="max-h-[min(60vh,16rem)] divide-y divide-border-default overflow-y-auto">
                      {HEADER_NOTIFICATIONS.map((n) => (
                        <li key={n.id}>
                          <Link
                            to={n.href}
                            className="block px-4 py-3 transition-colors hover:bg-surface-elevated"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <p className="text-sm font-medium text-text-primary">{t(n.titleKey)}</p>
                            <p className="mt-0.5 text-xs leading-snug text-text-secondary">{t(n.descKey)}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-border-default px-3 py-2">
                      <Link
                        to="/transactions"
                        className="block rounded-lg px-2 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/5"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        {t('nav.notifications_view_activity')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setLangMenuOpen((o) => !o)
                    setUserMenuOpen(false)
                    setNotificationsOpen(false)
                  }}
                  className="flex h-9 max-w-[11rem] min-w-0 items-center gap-1.5 rounded-lg px-2 text-text-muted transition-colors hover:bg-surface-elevated sm:gap-2 sm:px-2.5"
                  aria-label={`${t('language')}: ${t(`lang.${menuLang}`)}`}
                  aria-expanded={langMenuOpen}
                  aria-haspopup="listbox"
                >
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate text-xs font-medium text-text-primary sm:text-sm">
                    {t(`lang.${menuLang}`)}
                  </span>
                </button>
                {langMenuOpen && (
                  <div
                    role="listbox"
                    aria-label={t('language')}
                    className="absolute right-0 top-full z-[60] mt-1 min-w-[140px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] dark:border-slate-600 dark:bg-[#1E293B]"
                  >
                    {LANGUAGE_MENU_LANGS.map((lng) => {
                      const active = menuLang === lng
                      return (
                        <button
                          key={lng}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => changeLang(lng)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors ${
                            active
                              ? 'font-medium text-text-primary'
                              : 'text-text-primary hover:bg-[#F3F4F6] dark:hover:bg-[#334155]'
                          }`}
                        >
                          <span aria-hidden className="shrink-0 text-base leading-none">
                            {lng === 'en' ? '🇺🇸' : '🇪🇸'}
                          </span>
                          <span className="min-w-0 flex-1 text-left">{t(`lang.${lng}`)}</span>
                          {active ? (
                            <Check
                              className="h-4 w-4 shrink-0 text-[color:var(--brand-primary)]"
                              aria-hidden
                            />
                          ) : (
                            <span className="h-4 w-4 shrink-0" aria-hidden />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="relative ml-1" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen((o) => !o)
                    setLangMenuOpen(false)
                    setNotificationsOpen(false)
                  }}
                  className="flex items-center gap-1 rounded-lg border-2 border-transparent bg-white py-1 pl-1 pr-1.5 transition-[border-color,background-color] duration-150 hover:bg-slate-50 active:border-[color:var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]/35 focus-visible:ring-offset-2 dark:bg-transparent dark:hover:bg-white/5 dark:focus-visible:ring-offset-gray-950"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label={t('nav.user_menu')}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    {avatarLetter}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-600 transition-transform dark:text-slate-300 ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,17.5rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-[#F8F9FB] shadow-lg dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="py-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200/60 dark:text-white dark:hover:bg-white/10"
                        onClick={() => {
                          openChat()
                          setUserMenuOpen(false)
                        }}
                      >
                        {t('nav.share_feedback')}
                      </button>
                      <Link
                        role="menuitem"
                        to="/profile"
                        className="block px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200/60 dark:text-white dark:hover:bg-white/10"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.my_profile')}
                      </Link>
                      <Link
                        role="menuitem"
                        to="/profile"
                        className="block px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200/60 dark:text-white dark:hover:bg-white/10"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('nav.settings')}
                      </Link>
                    </div>
                    <div className="border-t border-slate-200 dark:border-gray-700" />
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {t('nav.theme_label')}
                      </span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-500 transition-colors hover:bg-slate-200/80 dark:text-amber-300 dark:hover:bg-white/10"
                        aria-label={t('nav.toggle_theme')}
                      >
                        {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="border-t border-slate-200 dark:border-gray-700" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full px-4 py-3 text-left text-sm font-normal text-slate-900 transition-colors hover:bg-slate-200/60 dark:text-white dark:hover:bg-white/10"
                      onClick={() => {
                        setUserMenuOpen(false)
                        void handleSignOut()
                      }}
                    >
                      {t('nav.log_out')}
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-elevated md:hidden"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border-default bg-surface-card pb-3 md:hidden">
            <div className="mx-auto max-w-7xl px-4">
              {navItems.map((item) => {
                const active = isNavActive(item.href, location.pathname)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    data-brand-nav-active={active ? '' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                      active ? 'font-semibold' : 'text-text-primary hover:bg-surface-elevated'
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </Link>
                )
              })}
              <div className="mt-2 border-t border-border-default pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    void handleSignOut()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-text-primary transition-all hover:bg-surface-elevated"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{t('nav.sign_out')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-surface-page">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <AnimatePresence>
            <Outlet />
          </AnimatePresence>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

export default AppShell
