-- How many days before a membership end date the student sees a reminder.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.reminder_settings (
  id integer primary key default 1 check (id = 1),
  days_before integer not null default 5 check (days_before between 1 and 60),
  updated_at timestamptz not null default now()
);

alter table public.reminder_settings enable row level security;

drop policy if exists "reminder_settings_public_read" on public.reminder_settings;
create policy "reminder_settings_public_read" on public.reminder_settings
  for select using (true);
