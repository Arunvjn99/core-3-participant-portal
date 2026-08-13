# Release Notes

## 2026-08-13 — Fix: hero illustration not rendering in production

### Root cause
- The pre-enrollment hero animation was a single VP9 WebM with a transparent alpha layer. WebKit (Safari on macOS, and every browser on iOS) cannot decode VP9 alpha, and the element had no alternate source, no poster, and no error handling — so affected browsers rendered an empty box instead of the illustration.
- The asset was also loaded from a Supabase project unrelated to this app (`pmmvggrzowobvbebjzdo`, while the portal uses `vrivhbghtffppkezvkfg`), served with `cache-control: no-cache`. That made a hero asset depend on third-party availability and re-downloaded 442 KB on every page view.

### Fixes
- Added an HEVC/MP4 encoding with an alpha layer (`hvc1`) for WebKit, alongside the existing WebM for Chromium and Gecko. Format is chosen per engine, since neither engine can decode the other's alpha format.
- Added a transparent still frame as the `poster`, so the illustration appears immediately while the video loads.
- Added fallback to the still frame when playback errors, when autoplay is refused, or when the video has not produced a frame within 8s. The hero can no longer render blank.
- The still frame is now also used when the user has `prefers-reduced-motion` set.
- Self-hosted all three assets under `public/media/`, removing the third-party dependency.

### Assets
- `public/media/hero-meeting.webm` — 374 KB (audio track stripped; video stream copied, so the artwork is unchanged).
- `public/media/hero-meeting.mp4` — 245 KB, HEVC with alpha.
- `public/media/hero-meeting-poster.png` — 145 KB, transparent still.
- Per-visit hero payload is now roughly 530 KB on Chromium and 400 KB on WebKit, cached rather than refetched.

### Deployment
- Added an immutable one-year `Cache-Control` header for `/media/*` in `netlify.toml`.

### Build
- Production build verified: `tsc -b && vite build` passes with no errors. ESLint clean on changed files.

---

## 2026-07-01 — Core AI professional tone refresh

### Copy & messaging
- Updated Core AI guided-flow copy across loan, enrollment, and vesting flows to use a more professional, enterprise-appropriate tone.
- Refined plan, contribution, investment, and withdrawal insight messages for clarity and consistency.
- Standardised error and fallback messages in the LLM service, local AI handler, and Netlify `ai-chat` function.

### Build
- Production build verified: `tsc -b && vite build` passes with no errors.

---

## 2026-07-01 — Demo script & Clarity project update

### Demo tooling
- Added standalone demo script page at `/congruent-demo-script.html` for usability test prep, with module-based walkthroughs (enrollment, transactions, Core AI, etc.).

### Analytics
- Updated Microsoft Clarity project ID to `vmcsp3vwom` in `index.html`.

### Build
- Production build verified: `tsc -b && vite build` passes with no errors.

---

## 2026-07-01 — Analytics & AI chat env update

### Analytics
- Added Microsoft Clarity session recording and heatmaps (`index.html`, project `vlsu7y65s0`).

### Core AI deployment
- Netlify `ai-chat` function now reads `GROK_API_KEY` from environment variables (set in Netlify dashboard → Site settings → Environment variables).

### Build
- Production build verified: `tsc -b && vite build` passes with no errors.

---

## 2026-07-01 — Core AI 2.0: LLM answers, rebalance & rollover flows

### Core AI panel
- Redesigned Core AI chat panel with dark/light theme toggle, expand/collapse, and route-aware greetings.
- Added LLM-powered answers via Groq (`llama-3.1-8b-instant`) for open-ended 401(k) questions, with guided-flow handoff when the user wants to take action.
- Follow-up suggestion chips after LLM responses (e.g. enrollment, rebalance, rollover).
- Improved structured cards for enrollment, withdrawal, rebalance, and rollover steps.

### New guided flows
- **Rebalance** — adjust fund allocation with preset targets and review step.
- **Rollover** — bring in an old 401(k)/IRA with type selection and review step.
- Enhanced enrollment, withdrawal, and vesting flows with richer step context.

### Backend & deployment
- Added Netlify serverless function `netlify/functions/ai-chat.ts` to proxy Groq API calls (keeps `GROQ_API_KEY` server-side).
- Updated `netlify.toml` with functions directory and esbuild bundler config.
- Dev mode supports direct Groq calls via `VITE_GROQ_API_KEY` in `.env.local`.

### Intent & routing
- Expanded intent resolver with rebalance and rollover scenario mappings.
- Informational questions route to LLM; action phrases still trigger local guided flows.

### Testing & build
- Added Core AI scenario tests at `src/features/ai/__tests__/coreAI.test.ts` (run with `npx vitest`).
- Excluded `__tests__` from app TypeScript build so production build stays clean.
- Production build verified: `tsc -b && vite build` passes with no errors.

---

## 2026-07-01 — Auth simplification & session theme switching

### Authentication
- Login now routes directly to the dashboard after successful sign-in (OTP step removed from the post-login flow).
- Sign-up and white-label auth routes redirect to the login page.
- Removed dev/demo auth bypass and OTP gate from protected routes.
- Fixed missing `Link` import on the login page (forgot-password link).

### Brand theming
- Added session-based company theme switching in Profile → Preferences.
- Users can preview any company theme for the current session; preference resets on sign-out.
- Theme resolution falls back to the Congruent default company (`slug: congruent`).
- Improved company row parsing to support both `logo_url` and `logo` columns across DB migrations.

### Data & routing
- `getAllCompanies()` now returns all companies (removed `status = active` filter) so theme options are available in preferences.
- Cleaned up unused signup and white-label auth imports from the router.

### Build
- Production build verified: `tsc -b && vite build` passes with no errors.
