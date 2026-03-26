-- GitMindPro MVP auth/profile schema

create extension if not exists pgcrypto;

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

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analyses
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  repo_url text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organization_id, repo_owner, repo_name)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_email text not null,
  role text not null check (role in ('admin', 'member')),
  token text not null unique default lower(encode(gen_random_bytes(12), 'hex')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_user_created_at on public.analyses(user_id, created_at desc);
create index if not exists idx_analyses_org_created_at on public.analyses(organization_id, created_at desc);

-- Shareable analysis links
alter table public.analyses
  add column if not exists share_token text unique default lower(encode(gen_random_bytes(8), 'hex')),
  add column if not exists is_public boolean not null default false;

create index if not exists idx_analyses_share_token on public.analyses(share_token) where is_public = true;
create index if not exists idx_org_memberships_user on public.organization_memberships(user_id);
create index if not exists idx_projects_org on public.projects(organization_id);
create index if not exists idx_workspace_invitations_org on public.workspace_invitations(organization_id, created_at desc);
create index if not exists idx_workspace_invitations_email on public.workspace_invitations(lower(invited_email));

create table if not exists public.pr_reviews (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  repo_owner text not null,
  repo_name text not null,
  pr_number integer not null,
  pr_title text not null,
  file_count integer not null default 0,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  review_result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pr_reviews_user_created on public.pr_reviews(user_id, created_at desc);
create index if not exists idx_pr_reviews_org_created on public.pr_reviews(organization_id, created_at desc);

alter table public.pr_reviews enable row level security;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('free', 'pro', 'team')),
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  seat_count integer not null default 1,
  organization_id uuid references public.organizations(id) on delete set null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);

alter table public.subscriptions enable row level security;

create policy if not exists "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy if not exists "subscriptions_upsert_service"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy if not exists "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy if not exists "pr_reviews_select_own"
  on public.pr_reviews for select
  using (
    auth.uid() = user_id
    and (
      organization_id is null
      or exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = pr_reviews.organization_id
          and m.user_id = auth.uid()
      )
    )
  );

create policy if not exists "pr_reviews_insert_own"
  on public.pr_reviews for insert
  with check (
    auth.uid() = user_id
    and (
      organization_id is null
      or exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = pr_reviews.organization_id
          and m.user_id = auth.uid()
      )
    )
  );

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.workspace_invitations enable row level security;

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
  using (
    auth.uid() = user_id
    and (
      organization_id is null
      or exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = analyses.organization_id
          and m.user_id = auth.uid()
      )
    )
  );

create policy if not exists "analyses_insert_own"
  on public.analyses for insert
  with check (
    auth.uid() = user_id
    and (
      organization_id is null
      or exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = analyses.organization_id
          and m.user_id = auth.uid()
      )
    )
  );

create policy if not exists "organizations_select_member"
  on public.organizations for select
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
    )
  );

create policy if not exists "organizations_insert_creator"
  on public.organizations for insert
  with check (auth.uid() = created_by);

create policy if not exists "organizations_update_owner_admin"
  on public.organizations for update
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy if not exists "org_memberships_select_member"
  on public.organization_memberships for select
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = organization_memberships.organization_id
        and m.user_id = auth.uid()
    )
  );

create policy if not exists "org_memberships_insert_owner_row"
  on public.organization_memberships for insert
  with check (
    auth.uid() = user_id
    and role = 'owner'
    and exists (
      select 1
      from public.organizations o
      where o.id = organization_id
        and o.created_by = auth.uid()
    )
  );

create policy if not exists "org_memberships_insert_invited_row"
  on public.organization_memberships for insert
  with check (
    auth.uid() = user_id
    and role in ('admin', 'member')
    and exists (
      select 1
      from public.workspace_invitations i
      where i.organization_id = organization_memberships.organization_id
        and i.accepted_at is null
        and i.expires_at > now()
        and lower(i.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and i.role = organization_memberships.role
    )
  );

create policy if not exists "projects_select_member"
  on public.projects for select
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
    )
  );

create policy if not exists "projects_insert_member"
  on public.projects for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
    )
  );

create policy if not exists "workspace_invitations_select_visible"
  on public.workspace_invitations for select
  using (
    exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = workspace_invitations.organization_id
        and m.user_id = auth.uid()
    )
    or (
      accepted_at is null
      and expires_at > now()
      and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy if not exists "workspace_invitations_insert_owner_admin"
  on public.workspace_invitations for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1
      from public.organization_memberships m
      where m.organization_id = workspace_invitations.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy if not exists "workspace_invitations_update_accept"
  on public.workspace_invitations for update
  using (
    accepted_at is null
    and expires_at > now()
    and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    accepted_by = auth.uid()
    and accepted_at is not null
    and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
