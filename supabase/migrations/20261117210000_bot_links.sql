-- Optional destination for each bot card. Empty means the built-in bot page.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.bot_links (
  slug text primary key,
  url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.bot_links enable row level security;

drop policy if exists "bot_links_public_read" on public.bot_links;
create policy "bot_links_public_read" on public.bot_links
  for select using (true);
