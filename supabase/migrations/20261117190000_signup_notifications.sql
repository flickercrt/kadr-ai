-- Admin notices when a profile is created (signup, Google, or a manual student).
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'signup',
  user_id uuid references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);

alter table public.admin_notifications enable row level security;

create or replace function public.notify_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (kind, user_id, body)
  values ('signup', new.id, coalesce(nullif(new.full_name, ''), nullif(new.email, ''), 'طالب جديد'));
  return new;
end;
$$;

drop trigger if exists notify_new_profile on public.profiles;
create trigger notify_new_profile
  after insert on public.profiles
  for each row execute function public.notify_new_profile();
