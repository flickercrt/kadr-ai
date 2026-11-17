-- Courses and lessons shown to students with an active membership.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  video_url text not null default '',
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  video_url text not null default '',
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_position_idx
  on public.courses (position, created_at);

create index if not exists lessons_course_position_idx
  on public.lessons (course_id, position, created_at);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;

drop policy if exists "courses_select_active_member" on public.courses;
create policy "courses_select_active_member" on public.courses
  for select using (
    published = true
    and exists (
      select 1
      from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now())
    )
  );

drop policy if exists "lessons_select_active_member" on public.lessons;
create policy "lessons_select_active_member" on public.lessons
  for select using (
    published = true
    and exists (
      select 1
      from public.courses c
      where c.id = course_id
        and c.published = true
    )
    and exists (
      select 1
      from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now())
    )
  );
