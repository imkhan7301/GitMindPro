-- GitMindPro MVP auth/profile schema

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  github_login text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  repo_url text not null,
  summary text,
  tech_stack text[] not null default '{}',
  scorecard jsonb,
  raw_analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_user_created_at on public.analyses(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;

create policy if not exists "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "profiles_upsert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy if not exists "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy if not exists "analyses_select_own"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy if not exists "analyses_insert_own"
  on public.analyses for insert
  with check (auth.uid() = user_id);
