-- Public FAQ. Safe to run more than once.
-- Visitors may read published rows. Writes stay on the service role.

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faq_items_position_idx
  on public.faq_items (position, created_at);

alter table public.faq_items enable row level security;

drop policy if exists "faq_items_select_published" on public.faq_items;
create policy "faq_items_select_published" on public.faq_items
  for select using (published = true);
