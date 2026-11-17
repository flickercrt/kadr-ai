-- Single row of membership price and an optional dated discount.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.pricing_settings (
  id integer primary key default 1 check (id = 1),
  monthly_price numeric(10, 2) not null,
  discount_kind text not null default 'none' check (discount_kind in ('none', 'percent', 'fixed')),
  discount_value numeric(10, 2) not null default 0,
  discount_starts_at timestamptz,
  discount_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.pricing_settings enable row level security;

drop policy if exists "pricing_settings_public_read" on public.pricing_settings;
create policy "pricing_settings_public_read" on public.pricing_settings
  for select using (true);
