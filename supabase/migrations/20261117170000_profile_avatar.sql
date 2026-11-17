-- Optional profile photo. The display name already lives on profiles.full_name.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.profiles add column if not exists avatar_url text;
