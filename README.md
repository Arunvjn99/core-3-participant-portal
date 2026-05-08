# Participant Portal

Production-ready US retirement participant portal built with React 19 + TypeScript + Vite.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + CSS custom properties |
| Components | Custom design system (shadcn/ui patterns) |
| Animation | Framer Motion |
| State | Zustand |
| Routing | React Router v7 |
| Backend | Supabase (auth + database) |
| i18n | i18next + react-i18next |

## Folder Structure

```
src/
├── main.tsx                    # Provider stack: Theme → Auth → User → Router
├── index.css                   # Tailwind directives + token imports
│
├── design-system/
│   ├── tokens/                 # CSS custom property definitions
│   ├── theme/                  # light.css / dark.css / brand.css overrides
│   ├── components/             # Owned UI primitives (Button, Input, Card, …)
│   └── motion/                 # Framer Motion variants, transitions, AnimatedPage
│
├── core/
│   ├── supabase.ts             # Null-safe Supabase client
│   ├── auth/                   # AuthContext, authService, ProtectedRoute
│   ├── theme/                  # ThemeContext, themeManager, defaultBrands
│   ├── user/                   # UserContext, userService
│   ├── store/                  # Zustand stores (otp, enrollmentDraft)
│   ├── hooks/                  # useAuth, useTheme, useUser
│   └── types/                  # Shared TypeScript types
│
├── router/
│   ├── index.tsx               # createBrowserRouter — all routes
│   ├── layouts/                # RootLayout, AuthLayout, AppShell
│   └── guards/                 # ValidatedVersionRoute
│
├── features/
│   ├── auth/                   # Login, Signup, VerifyOTP, ForgotPassword, ResetPassword
│   ├── dashboard/              # DashboardPage + widgets
│   ├── enrollment/             # Multi-step enrollment wizard
│   └── transactions/           # Loan, Withdrawal, FundTransfer, Rollover
│
└── lib/
    ├── cn.ts                   # clsx + tailwind-merge
    ├── utils.ts                # Shared helpers
    └── constants.ts            # Routes, env flags, storage keys
```

## Layer Rules

1. **Features never import from other features** — only from `core/`, `design-system/`, `lib/`
2. Every component file exports both a **named export** and a **default export**
3. **No inline styles** — Tailwind classes or CSS variables only
4. All CSS variables defined in `design-system/tokens/` — no hardcoded hex values
5. Each `features/` folder has an `index.ts` barrel exporting its public API
6. Every page component is wrapped in `<AnimatedPage>`

## Getting Started

```bash
cp .env.example .env
# Add your Supabase credentials (omit for demo mode)

npm install
npm run dev
```

The app runs in **demo mode** when Supabase env vars are absent — auth guards are bypassed automatically.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon/public key |
| `VITE_DEBUG_BYPASS_AUTH` | No | Set `true` to skip auth in development |

`VITE_*` variables are inlined at **build** time. After changing them in Netlify (or another host), trigger a **new deploy**.

## Deployment (production matches localhost)

This project ships as a **static Vite build** (`npm run build` → `dist/`). Dev (`npm run dev`) uses instant HMR; production is **pre-bundled** — you must **build and deploy** for hosted sites to update.

### Netlify (`netlify.toml`)

- **Publish directory:** `dist`
- **Build command:** `npm ci && npm run build` (also set in `netlify.toml`)
- **SPA routing:** all routes rewrite to `index.html` (React Router).
- **Caching:** `index.html` is sent with `no-cache` so browsers pick up new hashed JS/CSS after each deploy. `/assets/*` uses long cache + `immutable` (safe because filenames include content hashes).

### Branch & repository

Point Netlify (or your CI) at the **same GitHub repo and branch you push to**. If production tracks **`main`** but commits only land on another branch (for example `testing`), the live site will **not** change until that branch is merged or the deploy branch setting is updated.

### When the live site looks stale

1. Confirm the latest commit appears on the deployed branch on GitHub.
2. In Netlify: **Deploys → Trigger deploy → Clear cache and deploy site** (clears build cache, not just CDN edge cache).
3. Hard-refresh the browser or try an incognito window after deploy completes.

### Verify locally before pushing

```bash
npm ci
npm run build
npm run preview   # serves ./dist — same output as production hosting
```

GitHub Actions runs `npm ci` + `npm run build` on pushes and PRs to `main` so broken production builds are caught early.

## How to Add a New Feature

1. Create `src/features/<feature-name>/`
2. Add subdirectories: `pages/`, `components/`
3. Create an `index.ts` barrel file
4. Lazy-import pages in `src/router/index.tsx`
5. Add nav link to `AppShell.tsx` if needed

**Template:**
```
src/features/profile/
├── pages/
│   └── ProfilePage.tsx        # export function ProfilePage() + export default ProfilePage
├── components/
│   └── ProfileForm.tsx
└── index.ts                   # export { ProfilePage } from './pages/ProfilePage'
```

## How to Add a New Company Brand Theme

**Option A — CSS only (static)**

Add to `src/design-system/theme/brand.css`:
```css
html[data-brand="acme"] {
  --color-primary: #E03A2F;
  --color-primary-hover: #C02E24;
  --color-primary-active: #A0241B;
  --color-primary-subtle: #FDE8E7;
}
```

**Option B — Dynamic (runtime)**

1. Add entry to `src/core/theme/defaultBrands.ts`
2. Call `setCompanyTheme('acme')` from `useTheme()` after login

**Option C — From Supabase**

Implement `resolveBrandFromSupabase` in `src/core/theme/themeManager.ts` to fetch company brand data and call `setCompanyTheme`.

## Theme Switching

```tsx
import { useTheme } from '@/core/hooks/useTheme'

function ThemeToggle() {
  const { mode, setMode } = useTheme()
  return (
    <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  )
}
```

Themes are persisted in `localStorage` and applied as `html[data-theme="light|dark"]`.

## Auth Flow

```
/ → /:version/login
     ↓ sign in
/:version/verify (OTP)
     ↓ verified
/dashboard
```

`ProtectedRoute` guard order:
1. Demo mode → bypass
2. Loading → spinner
3. No session → redirect `/v1/login`
4. OTP not verified → redirect `/v1/verify`
5. Render children

## Versioned Routes

Auth routes are version-prefixed: `/v1/login`, `/v2/login`, etc.
The `ValidatedVersionRoute` guard rejects unknown versions and redirects to `v1`.
