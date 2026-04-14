-- Run in Supabase SQL editor or via CLI migration.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  page_path text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text
);

alter table public.feedback enable row level security;

create policy "Allow public insert for feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);
