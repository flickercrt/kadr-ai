-- Site-wide maintenance flag. One row. Safe to run more than once.
-- Anyone may read the flag so the proxy can render the public page.
-- Inserts and updates stay on the service role (no write policies).

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  maintenance boolean not null default false,
  maintenance_message text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select using (true);
