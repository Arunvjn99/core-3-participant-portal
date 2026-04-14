import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ClipboardList,
  ArrowLeftRight,
  TrendingUp,
  User,
  Search,
  Sparkles,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { useTheme } from '@/core/hooks/useTheme'
import { useAIStore } from '@/core/store/aiStore'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useBrandTheme } from '@/core/theme/BrandThemeContext'
import { CoreAIPanel } from '@/features/ai/components/CoreAIPanel'
import { AISearchPalette } from '@/features/ai/components/AISearchPalette'
import AppFooter from '@/features/dashboard/components/AppFooter'
import { supabase } from '@/core/supabase'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Enrollment', href: '/enrollment/plan', icon: ClipboardList },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Investments', href: '/investments', icon: TrendingUp },
  { label: 'Profile', href: '/profile', icon: User },
]

function isNavActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/enrollment/plan') return pathname.startsWith('/enrollment')
  return pathname.startsWith(href)
}

export function AppShell() {
  const { theme } = useBrandTheme()
  const { signOut, user } = useAuth()
  const { profile } = useUser()
  const { resolvedMode, setMode } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const openChat = useAIStore((s) => s.openChat)
  const toggleSearch = useAIStore((s) => s.toggleSearch)
  const [userDisplayName, setUserDisplayName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
              <span className="hidden max-w-[120px] truncate text-sm font-bold text-gray-900 dark:text-white sm:block">
                {theme.companyName}
              </span>
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(item.href, location.pathname)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    data-brand-nav-active={active ? '' : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                      active
                        ? ''
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleSearch}
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 sm:flex dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openChat}
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 sm:flex dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Open AI assistant"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white dark:border-gray-900"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                />
              </button>
              <Link
                to="/profile"
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {avatarInitials}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white pb-3 dark:border-gray-700 dark:bg-gray-900 md:hidden">
            <div className="mx-auto max-w-7xl px-4">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(item.href, location.pathname)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    data-brand-nav-active={active ? '' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                      active ? 'font-semibold' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
              <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    void handleSignOut()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-gray-700 transition-all hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-50/50 dark:bg-gray-950">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence>
            <Outlet />
          </AnimatePresence>
        </div>
      </main>

      <AppFooter />
      <CoreAIPanel />
      <AISearchPalette />

      <button
        type="button"
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 hover:opacity-90 active:scale-95"
        style={{ backgroundColor: 'var(--brand-primary)' }}
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-5 w-5 text-white" />
      </button>
    </div>
  )
}

export default AppShell
