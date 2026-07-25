-- ============================================================================
-- quejas-ar: initial schema
-- ============================================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text unique not null,
  trust_score int not null default 0,
  phone_verified boolean not null default false,
  is_moderator boolean not null default false,
  created_at timestamptz not null default now()
);

-- Companies / fake-page targets
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text not null check (industry in ('insurance','bank','telco','isp','ecommerce','scam')),
  is_legitimate boolean not null default true,
  instagram text,
  website text,
  created_at timestamptz not null default now()
);
create index companies_industry_idx on public.companies(industry);

-- Posts (3 types via discriminator)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  type text not null check (type in ('complaint','experience','scam_report')),
  title text not null,
  body text not null,
  evidence_urls text[] not null default '{}',
  sentiment text check (sentiment in ('negative','positive','neutral')),
  status text not null default 'pending_moderation' check (status in ('pending_moderation','published','rejected')),
  upvotes int not null default 0,
  downvotes int not null default 0,
  created_at timestamptz not null default now()
);
create index posts_status_created_idx on public.posts(status, created_at desc);
create index posts_company_idx on public.posts(company_id);
create index posts_user_idx on public.posts(user_id);
create index posts_type_idx on public.posts(type);

-- Votes (one per user/post)
create table public.votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  value int not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments(post_id, created_at);

-- Points events (silent rewards in V1)
create table public.points_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta int not null,
  reason text not null,
  post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index points_events_user_idx on public.points_events(user_id, created_at desc);

-- Badges
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id, code)
);

-- Anti-shilling flags
create table public.post_flags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  flagged_by uuid references public.profiles(id) on delete set null,
  system_reason text,
  reason text not null,
  created_at timestamptz not null default now()
);
create index post_flags_post_idx on public.post_flags(post_id);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, alias)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'alias',
      'usuario_' || substr(new.id::text, 1, 8)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recompute upvotes/downvotes on vote change
create or replace function public.recompute_post_votes()
returns trigger
language plpgsql
as $$
declare
  target_post uuid;
begin
  target_post := coalesce(new.post_id, old.post_id);
  update public.posts
  set
    upvotes = (select count(*) from public.votes where post_id = target_post and value = 1),
    downvotes = (select count(*) from public.votes where post_id = target_post and value = -1)
  where id = target_post;
  return null;
end;
$$;

create trigger votes_aiud_recompute
  after insert or update or delete on public.votes
  for each row execute function public.recompute_post_votes();

-- Rate limit: max 3 posts/day per user
create or replace function public.enforce_post_rate_limit()
returns trigger
language plpgsql
as $$
declare
  posts_today int;
begin
  select count(*) into posts_today
  from public.posts
  where user_id = new.user_id
    and created_at > now() - interval '1 day';
  if posts_today >= 3 then
    raise exception 'rate_limit_exceeded: max 3 posts per 24h';
  end if;
  return new;
end;
$$;

create trigger posts_rate_limit
  before insert on public.posts
  for each row execute function public.enforce_post_rate_limit();
