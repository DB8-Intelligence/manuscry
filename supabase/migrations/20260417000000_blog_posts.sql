-- Manuscry — Blog Posts table
-- Auto-generated blog for SEO and content marketing

create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  category text not null default 'Publicação',
  tags text[] not null default '{}',
  author_name text not null default 'Manuscry Editorial',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'scheduled')),
  seo_title text,
  seo_description text,
  cta_text text not null default 'Experimente o Manuscry grátis',
  cta_url text not null default 'https://manuscry.ai',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_status on public.blog_posts(status);
create index if not exists idx_blog_posts_published on public.blog_posts(published_at desc)
  where status = 'published';

create trigger set_updated_at_blog_posts
  before update on public.blog_posts
  for each row execute function public.handle_updated_at();

-- Blog is public read, admin write
alter table public.blog_posts enable row level security;

create policy "Anyone can read published posts"
  on public.blog_posts for select
  using (status = 'published');
