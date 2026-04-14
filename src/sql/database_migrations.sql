-- =============================================================================
-- White-Label Auth System — Database Migrations
-- Run in order in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COMPANIES
-- Stores branding + theme for each white-label client
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id             text        primary key default gen_random_uuid()::text,
  name           text        not null,
  logo           text,                          -- public URL to logo image
  primary_color  text        not null default '#2563eb',
  secondary_color text       not null default '#1e40af',
  accent_color   text        not null default '#60a5fa',
  font_family    text        default 'Inter, system-ui, sans-serif',
  status         text        not null default 'active'
                             check (status in ('active', 'inactive', 'suspended')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Seed sample companies
insert into public.companies (id, name, primary_color, secondary_color, accent_color, status)
values
  ('ascend',       'Ascend',            '#2563eb', '#1e40af', '#60a5fa', 'active'),
  ('techcorp',     'TechCorp',          '#7c3aed', '#6d28d9', '#a78bfa', 'active'),
  ('innovations',  'Innovations Inc',   '#059669', '#047857', '#10b981', 'active'),
  ('congruent',    'Congruent Solutions','#0f172a', '#1e293b', '#38bdf8', 'active')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 2. USER PROFILE
-- Extended profile attached to auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.user_profile (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text,
  email       text,
  company_id  text        references public.companies(id),
  state       text,
  country     text,
  status      text        not null default 'active'
                          check (status in ('active', 'inactive', 'suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint user_profile_user_id_key unique (user_id)
);

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profile_updated_at
  before update on public.user_profile
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. AUDIT LOG
-- Track all auth events for compliance / debugging
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigserial   primary key,
  user_id     uuid        references auth.users(id) on delete set null,
  event_type  text        not null,   -- 'signup' | 'login' | 'logout' | 'password_reset' | ...
  metadata    jsonb       default '{}'::jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index audit_log_user_id_idx on public.audit_log(user_id);
create index audit_log_event_type_idx on public.audit_log(event_type);
create index audit_log_created_at_idx on public.audit_log(created_at desc);

-- -----------------------------------------------------------------------------
-- 4. PASSWORD RESET TOKENS
-- Managed by Supabase Auth, but custom table for additional metadata
-- -----------------------------------------------------------------------------
create table if not exists public.password_reset_tokens (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  token_hash  text        not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index password_reset_tokens_user_id_idx on public.password_reset_tokens(user_id);

-- -----------------------------------------------------------------------------
-- 5. USER SESSIONS
-- Track active sessions (supplement Supabase's built-in session management)
-- -----------------------------------------------------------------------------
create table if not exists public.user_sessions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  session_token text      not null unique,
  company_id  text        references public.companies(id),
  ip_address  inet,
  user_agent  text,
  last_active timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

create index user_sessions_user_id_idx on public.user_sessions(user_id);

-- -----------------------------------------------------------------------------
-- 6. INVITE CODES
-- Allow companies to invite specific users
-- -----------------------------------------------------------------------------
create table if not exists public.invite_codes (
  id           uuid        primary key default gen_random_uuid(),
  code         text        not null unique,
  company_id   text        not null references public.companies(id),
  email        text,                     -- if null, code is open to any email
  used_by      uuid        references auth.users(id),
  used_at      timestamptz,
  expires_at   timestamptz,
  max_uses     int         default 1,
  use_count    int         default 0,
  created_by   uuid        references auth.users(id),
  created_at   timestamptz not null default now()
);

create index invite_codes_code_idx on public.invite_codes(code);
create index invite_codes_company_id_idx on public.invite_codes(company_id);

-- -----------------------------------------------------------------------------
-- 7. USER THEME PREFERENCES
-- Remember which company/theme a user last selected
-- -----------------------------------------------------------------------------
create table if not exists public.user_theme_preferences (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  company_id  text        references public.companies(id),
  updated_at  timestamptz not null default now(),
  constraint user_theme_preferences_user_id_key unique (user_id)
);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
alter table public.companies              enable row level security;
alter table public.user_profile           enable row level security;
alter table public.audit_log              enable row level security;
alter table public.password_reset_tokens  enable row level security;
alter table public.user_sessions          enable row level security;
alter table public.invite_codes           enable row level security;
alter table public.user_theme_preferences enable row level security;

-- ── companies ──
-- Anyone (including anonymous / unauthenticated) can read active companies
create policy "Companies are publicly readable"
  on public.companies for select
  using (status = 'active');

-- Only service_role (server) can insert/update/delete
create policy "Companies are managed by service role"
  on public.companies for all
  using (auth.role() = 'service_role');

-- ── user_profile ──
-- Users can read and update only their own profile
create policy "Users can read their own profile"
  on public.user_profile for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profile for update
  using (auth.uid() = user_id);

-- The signUpUser function runs as the new user after auth.signUp; allow insert
create policy "Users can insert their own profile"
  on public.user_profile for insert
  with check (auth.uid() = user_id);

-- ── audit_log ──
-- Users can read only their own audit events
create policy "Users can read their own audit log"
  on public.audit_log for select
  using (auth.uid() = user_id);

-- Anyone authenticated can insert (for login/logout events)
create policy "Authenticated users can insert audit events"
  on public.audit_log for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'anon');

-- ── password_reset_tokens ──
create policy "Users can read their own reset tokens"
  on public.password_reset_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reset tokens"
  on public.password_reset_tokens for insert
  with check (auth.uid() = user_id);

-- ── user_sessions ──
create policy "Users can read their own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.user_sessions for delete
  using (auth.uid() = user_id);

-- ── invite_codes ──
-- Authenticated users can read invite codes (to validate during signup)
create policy "Authenticated users can read invite codes"
  on public.invite_codes for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- Only service_role can create invite codes
create policy "Service role can manage invite codes"
  on public.invite_codes for all
  using (auth.role() = 'service_role');

-- ── user_theme_preferences ──
create policy "Users can manage their own theme preferences"
  on public.user_theme_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-create user_profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profile (user_id, name, email, company_id, status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'company_id',
    'active'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger: fire after each new auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- REALTIME
-- Enable realtime for user_profile so the UI can subscribe to live changes
-- =============================================================================
alter publication supabase_realtime add table public.user_profile;
alter publication supabase_realtime add table public.user_theme_preferences;

-- =============================================================================
-- DONE
-- =============================================================================
-- After running these migrations:
-- 1. Verify tables appear in Table Editor
-- 2. Check RLS policies in Authentication → Policies
-- 3. Seed additional companies as needed
-- 4. Test with a signup from the UI and verify user_profile row is created
-- =============================================================================
