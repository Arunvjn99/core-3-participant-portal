# Release Notes

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
