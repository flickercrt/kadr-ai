-- Saved courses, lessons, and bot chat sessions for the signed-in student.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('course', 'lesson', 'session')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);
