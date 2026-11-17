-- Admin and student action log. Only the service role writes and reads it.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  actor_role text not null default 'system',
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx
  on public.activity_log (created_at desc);

create index if not exists activity_log_action_idx
  on public.activity_log (action, created_at desc);

alter table public.activity_log enable row level security;
