create table if not exists public.website_media (
  slot_key text primary key,
  storage_path text not null,
  alt_text text not null default '',
  output_width integer not null check (output_width > 0),
  output_height integer not null check (output_height > 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.website_media enable row level security;

drop policy if exists "Public can view website media" on public.website_media;
create policy "Public can view website media"
on public.website_media
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can insert website media" on public.website_media;
create policy "Owners can insert website media"
on public.website_media
for insert
to authenticated
with check (private.has_staff_role(array['owner','admin']::text[]));

drop policy if exists "Owners can update website media" on public.website_media;
create policy "Owners can update website media"
on public.website_media
for update
to authenticated
using (private.has_staff_role(array['owner','admin']::text[]))
with check (private.has_staff_role(array['owner','admin']::text[]));

drop policy if exists "Owners can delete website media" on public.website_media;
create policy "Owners can delete website media"
on public.website_media
for delete
to authenticated
using (private.has_staff_role(array['owner','admin']::text[]));

grant select on public.website_media to anon, authenticated;
grant insert, update, delete on public.website_media to authenticated;

-- Website media is stored in the existing public-content bucket under website/*.
drop policy if exists "Owners can upload website media" on storage.objects;
create policy "Owners can upload website media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'public-content'
  and (storage.foldername(name))[1] = 'website'
  and private.has_staff_role(array['owner','admin']::text[])
);

drop policy if exists "Owners can update website media objects" on storage.objects;
create policy "Owners can update website media objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'public-content'
  and (storage.foldername(name))[1] = 'website'
  and private.has_staff_role(array['owner','admin']::text[])
)
with check (
  bucket_id = 'public-content'
  and (storage.foldername(name))[1] = 'website'
  and private.has_staff_role(array['owner','admin']::text[])
);

drop policy if exists "Owners can delete website media objects" on storage.objects;
create policy "Owners can delete website media objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'public-content'
  and (storage.foldername(name))[1] = 'website'
  and private.has_staff_role(array['owner','admin']::text[])
);
