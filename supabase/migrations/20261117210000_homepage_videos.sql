-- Homepage video shelf: title plus a YouTube URL, ordered by the admin.
-- Safe to run more than once in the Supabase SQL editor.
-- The public site may read the rows. Inserts, updates, and deletes stay on
-- the service role (no write policies), which bypasses RLS.

create table if not exists public.homepage_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_videos_position_idx
  on public.homepage_videos (position, created_at);

alter table public.homepage_videos enable row level security;

drop policy if exists "homepage_videos_select_public" on public.homepage_videos;
create policy "homepage_videos_select_public" on public.homepage_videos
  for select using (true);
