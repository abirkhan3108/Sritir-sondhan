-- স্মৃতি সংরক্ষণ — Supabase setup (Admin Dashboard + APK)

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  father_spouse text,
  village text,
  age integer,
  death_reason text,
  death_date date,
  photo_url text,
  birth_date date,
  address text,
  family_info text,
  bio text,
  memory text,
  created_at timestamptz default now()
);

-- If the table was created by an older version, add the dashboard fields.
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists family_info text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists memory text;

alter table public.profiles enable row level security;

drop policy if exists "public can read profiles" on public.profiles;
drop policy if exists "authenticated can insert profiles" on public.profiles;
drop policy if exists "authenticated can update profiles" on public.profiles;
drop policy if exists "authenticated can delete profiles" on public.profiles;

create policy "public can read profiles"
on public.profiles for select
to anon, authenticated
using (true);

create policy "authenticated can insert profiles"
on public.profiles for insert
to authenticated
with check (true);

create policy "authenticated can update profiles"
on public.profiles for update
to authenticated
using (true) with check (true);

create policy "authenticated can delete profiles"
on public.profiles for delete
to authenticated
using (true);

-- Existing bucket used by the app.
insert into storage.buckets (id, name, public)
values ('person-photos', 'person-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public can view person photos" on storage.objects;
drop policy if exists "authenticated can upload person photos" on storage.objects;
drop policy if exists "authenticated can update person photos" on storage.objects;
drop policy if exists "authenticated can delete person photos" on storage.objects;

create policy "public can view person photos"
on storage.objects for select
to public
using (bucket_id = 'person-photos');

create policy "authenticated can upload person photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'person-photos');

create policy "authenticated can update person photos"
on storage.objects for update
to authenticated
using (bucket_id = 'person-photos')
with check (bucket_id = 'person-photos');

create policy "authenticated can delete person photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'person-photos');

notify pgrst, 'reload schema';
