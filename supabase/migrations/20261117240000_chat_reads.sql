-- Read cursors so the inbox can show an unread count for 1:1 chat.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.inbox_threads add column if not exists student_read_at timestamptz not null default now();
alter table public.inbox_threads add column if not exists admin_read_at timestamptz not null default now();
