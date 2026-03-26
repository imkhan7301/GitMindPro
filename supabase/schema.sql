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

-- Referral system
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text not null unique default lower(encode(gen_random_bytes(6), 'hex')),
  referred_user_id uuid references public.profiles(id) on delete set null,
  bonus_days integer not null default 7,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create unique index if not exists idx_referrals_code on public.referrals(referral_code);
create index if not exists idx_referrals_referred on public.referrals(referred_user_id) where referred_user_id is not null;

alter table public.referrals enable row level security;

create policy if not exists "referrals_select_own"
  on public.referrals for select
  using (auth.uid() = referrer_id);

create policy if not exists "referrals_insert_own"
  on public.referrals for insert
  with check (auth.uid() = referrer_id);

-- ═══════════════════════════════════════════════════════════════════
-- Expert Marketplace
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  headline text not null default '',
  bio text not null default '',
  skills text[] not null default '{}',
  hourly_rate integer not null default 0,          -- USD cents
  currency text not null default 'USD',
  availability text not null check (availability in ('available', 'busy', 'unavailable')) default 'available',
  years_experience integer not null default 0,
  github_url text,
  linkedin_url text,
  website_url text,
  portfolio_repos text[] not null default '{}',    -- GitHub URLs of showcase repos
  total_reviews integer not null default 0,
  avg_rating numeric(2,1) not null default 0.0,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expert_profiles_user on public.expert_profiles(user_id);
create index if not exists idx_expert_profiles_visible on public.expert_profiles(is_visible, avg_rating desc) where is_visible = true;
create index if not exists idx_expert_profiles_skills on public.expert_profiles using gin(skills);

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  expert_id uuid not null references public.expert_profiles(id) on delete cascade,
  repo_url text,
  analysis_id bigint references public.analyses(id) on delete set null,
  service_type text not null check (service_type in ('code_review', 'security_audit', 'architecture', 'onboarding', 'mentoring', 'other')),
  message text not null,
  budget_cents integer,                             -- proposed budget in cents
  status text not null check (status in ('pending', 'accepted', 'declined', 'completed', 'canceled')) default 'pending',
  expert_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consultation_requester on public.consultation_requests(requester_id, created_at desc);
create index if not exists idx_consultation_expert on public.consultation_requests(expert_id, created_at desc);

create table if not exists public.expert_reviews (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultation_requests(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  expert_id uuid not null references public.expert_profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_expert_reviews_unique on public.expert_reviews(consultation_id, reviewer_id);
create index if not exists idx_expert_reviews_expert on public.expert_reviews(expert_id, created_at desc);

alter table public.expert_profiles enable row level security;
alter table public.consultation_requests enable row level security;
alter table public.expert_reviews enable row level security;

-- Expert profiles: visible to all authenticated users, editable by owner
create policy if not exists "expert_profiles_select_all"
  on public.expert_profiles for select
  using (is_visible = true or auth.uid() = user_id);

create policy if not exists "expert_profiles_insert_own"
  on public.expert_profiles for insert
  with check (auth.uid() = user_id);

create policy if not exists "expert_profiles_update_own"
  on public.expert_profiles for update
  using (auth.uid() = user_id);

-- Consultation requests: viewable by requester or expert
create policy if not exists "consultations_select_own"
  on public.consultation_requests for select
  using (
    auth.uid() = requester_id
    or exists (select 1 from public.expert_profiles ep where ep.id = expert_id and ep.user_id = auth.uid())
  );

create policy if not exists "consultations_insert_own"
  on public.consultation_requests for insert
  with check (auth.uid() = requester_id);

create policy if not exists "consultations_update_participant"
  on public.consultation_requests for update
  using (
    auth.uid() = requester_id
    or exists (select 1 from public.expert_profiles ep where ep.id = expert_id and ep.user_id = auth.uid())
  );

-- Reviews: viewable by all, writeable by consultation requester
create policy if not exists "expert_reviews_select_all"
  on public.expert_reviews for select
  using (true);

create policy if not exists "expert_reviews_insert_own"
  on public.expert_reviews for insert
  with check (auth.uid() = reviewer_id);

-- ============================================================
-- Watched Repos (for scheduled cron analysis)
-- ============================================================

create table if not exists public.watched_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  repo_owner text not null,
  repo_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, repo_owner, repo_name)
);

create index if not exists idx_watched_repos_user on public.watched_repos(user_id);
create index if not exists idx_watched_repos_active on public.watched_repos(active) where active = true;

alter table public.watched_repos enable row level security;

create policy if not exists "watched_repos_select_own"
  on public.watched_repos for select
  using (auth.uid() = user_id);

create policy if not exists "watched_repos_insert_own"
  on public.watched_repos for insert
  with check (auth.uid() = user_id);

create policy if not exists "watched_repos_update_own"
  on public.watched_repos for update
  using (auth.uid() = user_id);

create policy if not exists "watched_repos_delete_own"
  on public.watched_repos for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Digest Queue (for email digests)
-- ============================================================

create table if not exists public.digest_queue (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  scorecard jsonb,
  summary text,
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_digest_queue_unsent on public.digest_queue(user_id, sent) where sent = false;

alter table public.digest_queue enable row level security;

create policy if not exists "digest_queue_select_own"
  on public.digest_queue for select
  using (auth.uid() = user_id);

-- ============================================================
-- User Preferences (email digest opt-in, notification settings)
-- ============================================================

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_digest boolean not null default true,
  slack_notifications boolean not null default true,
  digest_frequency text not null default 'weekly' check (digest_frequency in ('daily', 'weekly', 'never')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy if not exists "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy if not exists "user_preferences_upsert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy if not exists "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- ============================================================
-- API Keys (public REST API access)
-- ============================================================

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Default',
  key_hash text not null unique,
  key_prefix text not null,
  scopes text[] not null default '{analyze,read}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_user on public.api_keys(user_id);
create index if not exists idx_api_keys_hash on public.api_keys(key_hash) where revoked = false;

alter table public.api_keys enable row level security;

create policy if not exists "api_keys_select_own"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy if not exists "api_keys_insert_own"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy if not exists "api_keys_update_own"
  on public.api_keys for update
  using (auth.uid() = user_id);

create policy if not exists "api_keys_delete_own"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- API usage logs for rate limiting and analytics
create table if not exists public.api_usage_logs (
  id bigserial primary key,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  repo_owner text,
  repo_name text,
  status_code integer not null default 200,
  response_time_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_key_created on public.api_usage_logs(api_key_id, created_at desc);
create index if not exists idx_api_usage_user_created on public.api_usage_logs(user_id, created_at desc);

-- ─── Webhook Events ─────────────────────────────────────────
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  repo text not null,
  action text,
  sender text,
  payload_summary text,
  raw_headers jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_repo on public.webhook_events(repo, created_at desc);

-- Auto-purge old webhook events (keep 30 days)
-- Run: DELETE FROM public.webhook_events WHERE created_at < now() - interval '30 days';
