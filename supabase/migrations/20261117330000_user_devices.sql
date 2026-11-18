-- Devices signed in to each account, plus the active-device limit.
-- Safe to run more than once in the Supabase SQL editor.
-- Students can read their own rows. Writes go through the service role.

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_id text not null,
  user_agent text,
  device_label text,
  ip text,
  country text,
  city text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists user_devices_user_device_idx
  on public.user_devices (user_id, device_id);

create index if not exists user_devices_user_seen_idx
  on public.user_devices (user_id, last_seen_at desc);

alter table public.user_devices enable row level security;

drop policy if exists "user_devices_select_own" on public.user_devices;
create policy "user_devices_select_own" on public.user_devices
  for select using (auth.uid() = user_id);

create table if not exists public.device_settings (
  id integer primary key default 1 check (id = 1),
  max_devices integer not null default 2 check (max_devices >= 1 and max_devices <= 10),
  updated_at timestamptz not null default now()
);

alter table public.device_settings enable row level security;

insert into public.device_settings (id, max_devices)
values (1, 2)
on conflict (id) do nothing;
