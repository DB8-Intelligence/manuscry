-- Manuscry — Production Hardening Migration
-- Consolida índices de performance e extensões para escala

-- ============================================================================
-- PERFORMANCE INDEXES (JSONB queries)
-- ============================================================================

-- Author profile nested lookups (affiliate codes, bank accounts, api keys)
create index if not exists idx_users_affiliate_code
  on public.users ((author_profile->>'affiliate_code'))
  where author_profile->>'affiliate_code' is not null;

-- Projects by phase/status for dashboard queries
create index if not exists idx_projects_current_phase on public.projects(current_phase);

-- Projects marketplace visibility (published + opted_in_marketplace)
create index if not exists idx_projects_published_marketplace
  on public.projects(updated_at desc)
  where status = 'published';

-- Blog posts published index already exists from prior migration

-- ============================================================================
-- USAGE TRACKING (for rate limits + analytics)
-- ============================================================================

create table if not exists public.api_usage_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  api_key_id text,
  endpoint text not null,
  method text not null,
  status_code integer not null,
  response_time_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_user_date
  on public.api_usage_log(user_id, created_at desc);
create index if not exists idx_api_usage_key_date
  on public.api_usage_log(api_key_id, created_at desc)
  where api_key_id is not null;

alter table public.api_usage_log enable row level security;

create policy "Users see own usage"
  on public.api_usage_log for select
  using (auth.uid() = user_id);

-- ============================================================================
-- WEBHOOK DELIVERIES (for debugging + retry)
-- ============================================================================

create table if not exists public.webhook_deliveries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  webhook_url text not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed', 'retrying')),
  response_code integer,
  response_body text,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_user_status
  on public.webhook_deliveries(user_id, status, created_at desc);

alter table public.webhook_deliveries enable row level security;

create policy "Users see own webhooks"
  on public.webhook_deliveries for select
  using (auth.uid() = user_id);

-- ============================================================================
-- BOOK PREVIEW VIEW COUNTS (for marketplace analytics)
-- ============================================================================

create table if not exists public.book_preview_views (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  viewer_ip_hash text,
  viewer_user_id uuid references public.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_preview_views_project
  on public.book_preview_views(project_id, viewed_at desc);

-- Public read (for aggregated counts)
alter table public.book_preview_views enable row level security;

create policy "Authors see own project views"
  on public.book_preview_views for select
  using (exists (
    select 1 from public.projects
    where projects.id = book_preview_views.project_id
    and projects.user_id = auth.uid()
  ));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Aggregate preview count for a project
create or replace function public.get_preview_count(p_project_id uuid)
returns integer as $$
  select count(*)::integer from public.book_preview_views where project_id = p_project_id;
$$ language sql security definer stable;
