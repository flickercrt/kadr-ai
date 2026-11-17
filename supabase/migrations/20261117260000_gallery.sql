-- Managed gallery. Public reads published items. Uploads use the service role.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.gallery_categories (id) on delete set null,
  title text not null,
  description text not null default '',
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  image_url text not null default '',
  video_url text not null default '',
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_categories_position_idx
  on public.gallery_categories (position, created_at);

create index if not exists gallery_items_position_idx
  on public.gallery_items (position, created_at);

alter table public.gallery_categories enable row level security;
alter table public.gallery_items enable row level security;

drop policy if exists "gallery_categories_public_read" on public.gallery_categories;
create policy "gallery_categories_public_read" on public.gallery_categories
  for select using (true);

drop policy if exists "gallery_items_public_read" on public.gallery_items;
create policy "gallery_items_public_read" on public.gallery_items
  for select using (published = true);

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "gallery_public_read" on storage.objects;
create policy "gallery_public_read" on storage.objects
  for select using (bucket_id = 'gallery');
