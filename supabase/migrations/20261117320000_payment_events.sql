-- Stripe payment history. Students can read their own rows. The service role writes them.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  provider text not null default 'stripe',
  provider_event_id text,
  event_type text not null,
  amount_cents integer,
  currency text,
  status text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists payment_events_event_idx
  on public.payment_events (provider_event_id);

create index if not exists payment_events_user_idx
  on public.payment_events (user_id, created_at desc);

alter table public.payment_events enable row level security;

drop policy if exists "payment_events_select_own" on public.payment_events;
create policy "payment_events_select_own" on public.payment_events
  for select using (auth.uid() = user_id);
