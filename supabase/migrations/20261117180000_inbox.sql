-- In-site inbox and course certificates.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.inbox_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbox_threads_student_idx
  on public.inbox_threads (student_id, updated_at desc);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.inbox_threads (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_role text not null check (sender_role in ('student', 'admin', 'system')),
  body text not null,
  kind text not null default 'chat' check (kind in ('chat', 'certificate', 'reminder', 'notice')),
  created_at timestamptz not null default now()
);

create index if not exists inbox_messages_thread_idx
  on public.inbox_messages (thread_id, created_at);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_name text not null default '',
  course_title text not null default '',
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.inbox_threads enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.certificates enable row level security;

drop policy if exists "inbox_threads_select_own" on public.inbox_threads;
create policy "inbox_threads_select_own" on public.inbox_threads
  for select using (auth.uid() = student_id);

drop policy if exists "inbox_messages_select_own" on public.inbox_messages;
create policy "inbox_messages_select_own" on public.inbox_messages
  for select using (
    exists (
      select 1 from public.inbox_threads t
      where t.id = thread_id and t.student_id = auth.uid()
    )
  );

drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select using (auth.uid() = user_id);
