-- Editable public SEO fields. Safe to run more than once.
-- The site may read the row. Writes stay on the service role.

create table if not exists public.seo_settings (
  id integer primary key default 1 check (id = 1),
  title text not null default '',
  description text not null default '',
  keywords text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.seo_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.seo_settings enable row level security;

drop policy if exists "seo_settings_select_public" on public.seo_settings;
create policy "seo_settings_select_public" on public.seo_settings
  for select using (true);
