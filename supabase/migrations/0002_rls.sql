-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.posts enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.points_events enable row level security;
alter table public.badges enable row level security;
alter table public.post_flags enable row level security;

-- Helper: is the current user a moderator?
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_moderator from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- profiles
-- ============================================================================
create policy profiles_select_public on public.profiles
  for select using (true);

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- ============================================================================
-- companies (public read; mods can write)
-- ============================================================================
create policy companies_select_public on public.companies
  for select using (true);

create policy companies_write_mods on public.companies
  for all using (public.is_moderator())
  with check (public.is_moderator());

-- ============================================================================
-- posts
-- ============================================================================

-- Public can read published; owner can read all their posts; mods can read all
create policy posts_select_public_or_own on public.posts
  for select using (
    status = 'published'
    or user_id = auth.uid()
    or public.is_moderator()
  );

-- Only authenticated users can insert; user_id must match auth.uid()
create policy posts_insert_self on public.posts
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- Owners can update only their own posts that are still pending
create policy posts_update_self_pending on public.posts
  for update using (
    user_id = auth.uid()
    and status = 'pending_moderation'
  );

-- Mods can update any post
create policy posts_update_mods on public.posts
  for update using (public.is_moderator());

-- Mods can delete
create policy posts_delete_mods on public.posts
  for delete using (public.is_moderator());

-- ============================================================================
-- votes
-- ============================================================================
create policy votes_select_public on public.votes
  for select using (true);

create policy votes_upsert_self on public.votes
  for insert with check (user_id = auth.uid());

create policy votes_update_self on public.votes
  for update using (user_id = auth.uid());

create policy votes_delete_self on public.votes
  for delete using (user_id = auth.uid());

-- ============================================================================
-- comments
-- ============================================================================
create policy comments_select_public on public.comments
  for select using (
    exists (select 1 from public.posts where id = comments.post_id and status = 'published')
  );

create policy comments_insert_self on public.comments
  for insert with check (user_id = auth.uid());

create policy comments_delete_self_or_mod on public.comments
  for delete using (user_id = auth.uid() or public.is_moderator());

-- ============================================================================
-- points_events (own user can read; service role writes)
-- ============================================================================
create policy points_select_self on public.points_events
  for select using (user_id = auth.uid() or public.is_moderator());

-- No insert/update/delete policies → only service role can write.

-- ============================================================================
-- badges (public read; service role writes)
-- ============================================================================
create policy badges_select_public on public.badges
  for select using (true);

-- ============================================================================
-- post_flags (mods only)
-- ============================================================================
create policy post_flags_select_mods on public.post_flags
  for select using (public.is_moderator());

create policy post_flags_insert_authenticated on public.post_flags
  for insert with check (auth.uid() is not null);
