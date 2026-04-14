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
} from 'lucide-react'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { useTheme } from '@/core/hooks/useTheme'
import { useAIStore } from '@/core/store/aiStore'
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
  const { signOut, user } = useAuth()
  const { profile } = useUser()
  const { resolvedMode, setMode } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const openChat = useAIStore((s) => s.openChat)
  const toggleSearch = useAIStore((s) => s.toggleSearch)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('Participant Portal')

  useEffect(() => {
    async function loadCompanyBranding() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_companies')
        .select('companies(name, logo_url, primary_color, branding_json)')
        .eq('user_id', user.id)
        .single()

      if (data?.companies) {
        const company = data.companies as {
          name?: string
          logo_url?: string
          primary_color?: string
          branding_json?: unknown
        }

        if (company.name) setCompanyName(company.name)
        if (company.logo_url) setCompanyLogo(company.logo_url)

        // Apply primary color as CSS variable for white-label theming
        if (company.primary_color) {
          document.documentElement.style.setProperty('--color-brand', company.primary_color)
          document.documentElement.style.setProperty('--color-brand-hover', company.primary_color + 'dd')
        }

        // Apply branding_json if present (font-family etc.)
        if (company.branding_json) {
          try {
            const branding =
              typeof company.branding_json === 'string'
                ? JSON.parse(company.branding_json)
                : company.branding_json
            if (branding && typeof branding === 'object' && 'font_family' in branding) {
              document.documentElement.style.setProperty('--font-sans', String(branding.font_family))
            }
          } catch {
            // ignore malformed branding_json
          }
        }
      }
    }
    loadCompanyBranding()
  }, [])

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

  const handleSignOut = async () => {
    await signOut()
    navigate('/v1/login')
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
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Main bar — 56px */}
        <div className="px-4 sm:px-6 h-14 flex items-center gap-4">

          {/* LEFT: Logo — fixed width so center nav stays centered */}
          <div className="flex items-center gap-2.5 w-44 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-white font-bold text-sm">{companyName.charAt(0)}</span>
              )}
            </div>
            <span className="font-bold text-base text-gray-900 dark:text-white truncate hidden sm:block">
              {companyName}
            </span>
          </div>

          {/* CENTER: Nav links — desktop only, takes remaining space, centered */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href, location.pathname)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* RIGHT: Actions — fixed width matching left */}
          <div className="flex items-center gap-1 w-44 justify-end shrink-0">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Search */}
            <button
              type="button"
              onClick={toggleSearch}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open search"
            >
              <Search className="w-4 h-4" />
            </button>
            {/* AI */}
            <button
              type="button"
              onClick={openChat}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open AI assistant"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {/* Bell */}
            <button
              type="button"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
            </button>
            {/* Avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ml-1 shrink-0"
            >
              {initials}
            </Link>
            {/* Logout */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* MOBILE: bottom nav bar */}
        <div className="md:hidden flex items-center border-t border-gray-100 dark:border-gray-800 px-2 pb-1 pt-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href, location.pathname)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-50/50 dark:bg-gray-950">
        <AnimatePresence>
          <Outlet />
        </AnimatePresence>
      </main>

      <AppFooter />
      <CoreAIPanel />
      <AISearchPalette />

      {/* Floating AI button */}
      <button
        type="button"
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all hover:scale-110 active:scale-95"
        aria-label="Open AI assistant"
      >
        <Sparkles className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}

export default AppShell
