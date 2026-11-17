-- student, instructor, or admin. ADMIN_EMAILS still counts as admin without this column.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.profiles add column if not exists role text not null default 'student';

do $$
begin
  alter table public.profiles
    add constraint profiles_role_check check (role in ('student', 'instructor', 'admin'));
exception
  when duplicate_object then null;
end $$;
