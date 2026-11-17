-- Kadr AI: profiles, subscriptions, chat, and monthly usage.
-- Run in the Supabase SQL editor (or via the Supabase CLI) on a fresh project.
-- Students can read their own rows. Writes that affect billing or assistant
-- messages go through the service role, which bypasses RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'past_due', 'canceled')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (provider_customer_id);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bot_slug text not null,
  title text not null default 'محادثة جديدة',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_bot_idx
  on public.chat_sessions (user_id, bot_slug, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_idx
  on public.messages (session_id, created_at);

create table if not exists public.usage_monthly (
  user_id uuid not null references public.profiles (id) on delete cascade,
  period text not null,
  message_count integer not null default 0,
  primary key (user_id, period)
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.usage_monthly enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "sessions_select_own" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "messages_select_own" on public.messages
  for select using (auth.uid() = user_id);

create policy "usage_select_own" on public.usage_monthly
  for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  insert into public.subscriptions (user_id, status)
  values (new.id, 'inactive');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
