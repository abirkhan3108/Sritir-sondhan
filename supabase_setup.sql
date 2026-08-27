-- স্মৃতি সংরক্ষণ — secure Admin setup
create table if not exists public.persons (
  id uuid primary key, name text not null, birth_date date, death_date date, address text, family_info text, bio text, memory text, photo_url text, created_at timestamptz default now()
);
alter table public.persons enable row level security;
drop policy if exists "public can read persons" on public.persons;
drop policy if exists "authenticated can insert persons" on public.persons;
drop policy if exists "authenticated can update persons" on public.persons;
drop policy if exists "authenticated can delete persons" on public.persons;
create policy "public can read persons" on public.persons for select to anon, authenticated using (true);
create policy "authenticated can insert persons" on public.persons for insert to authenticated with check (true);
create policy "authenticated can update persons" on public.persons for update to authenticated using (true) with check (true);
create policy "authenticated can delete persons" on public.persons for delete to authenticated using (true);
insert into storage.buckets (id,name,public) values ('person-person-photos','person-person-photos',true) on conflict (id) do nothing;
drop policy if exists "public can view person person-photos" on storage.objects;
drop policy if exists "authenticated can upload person person-photos" on storage.objects;
drop policy if exists "authenticated can update person person-photos" on storage.objects;
drop policy if exists "authenticated can delete person person-photos" on storage.objects;
create policy "public can view person person-photos" on storage.objects for select to public using (bucket_id='person-person-photos');
create policy "authenticated can upload person person-photos" on storage.objects for insert to authenticated with check (bucket_id='person-person-photos');
create policy "authenticated can update person person-photos" on storage.objects for update to authenticated using (bucket_id='person-person-photos') with check (bucket_id='person-person-photos');
create policy "authenticated can delete person person-photos" on storage.objects for delete to authenticated using (bucket_id='person-person-photos');
