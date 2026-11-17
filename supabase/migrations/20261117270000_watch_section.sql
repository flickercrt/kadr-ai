-- Editable homepage "watch this first" block. One row.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.watch_section (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default true,
  kicker_ar text not null default '',
  kicker_en text not null default '',
  title_ar text not null default '',
  title_en text not null default '',
  lead_ar text not null default '',
  lead_en text not null default '',
  video_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.watch_section enable row level security;

drop policy if exists "watch_section_public_read" on public.watch_section;
create policy "watch_section_public_read" on public.watch_section
  for select using (true);

insert into storage.buckets (id, name, public)
values ('watch-media', 'watch-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "watch_media_public_read" on storage.objects;
create policy "watch_media_public_read" on storage.objects
  for select using (bucket_id = 'watch-media');
