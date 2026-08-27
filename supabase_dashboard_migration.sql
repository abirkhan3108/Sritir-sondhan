-- Run once after the main Supabase setup.
-- Makes the profiles table match the Admin Dashboard fields.
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists family_info text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists memory text;

-- The app uses the existing person-photos bucket.
insert into storage.buckets (id, name, public)
values ('person-photos', 'person-photos', true)
on conflict (id) do update set public = true;

-- Refresh PostgREST schema cache.
notify pgrst, 'reload schema';
