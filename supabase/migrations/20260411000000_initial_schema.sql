-- Manuscry — Initial Schema
-- Applied to: noakyceiyzqjujwewgyt (sa-east-1)
-- This migration creates the complete schema for the Manuscry SaaS

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- ============================================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  plan text not null default 'trial'
    check (plan in ('trial', 'starter', 'pro', 'publisher')),
  market text not null default 'pt-br'
    check (market in ('pt-br', 'en', 'both')),
  books_this_month integer not null default 0,
  books_limit integer not null default 1,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  stripe_subscription_id text,
  hotmart_subscriber_code text,
  author_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE: projects
-- ============================================================================

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  market text not null default 'pt-br'
    check (market in ('pt-br', 'en')),
  genre text,
  genre_mode text
    check (genre_mode is null or genre_mode in ('fiction', 'nonfiction')),
  status text not null default 'active'
    check (status in ('active', 'paused', 'published', 'archived')),
  current_phase integer not null default 0,
  phases_completed integer[] not null default '{}',

  -- Pipeline data (JSONB per phase)
  phase_0_data jsonb,
  phase_1_data jsonb,
  phase_2_data jsonb,
  phase_3_data jsonb,
  phase_4_data jsonb,
  phase_5_data jsonb,

  -- Post-publication tracking
  asin text,
  isbn_ebook text,
  isbn_print text,
  bsr_week1 integer,
  reviews_month1 integer,
  revenue_month1 numeric(10, 2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_user_status on public.projects(user_id, status);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_plan on public.users(plan);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_projects
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.users enable row level security;
alter table public.projects enable row level security;

-- Users: can only read/update own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Projects: full CRUD on own projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Service role bypasses RLS automatically

-- ============================================================================
-- MONTHLY RESET FUNCTION (call via cron or n8n)
-- ============================================================================

create or replace function public.reset_monthly_book_counts()
returns void as $$
begin
  update public.users set books_this_month = 0;
end;
$$ language plpgsql security definer;
