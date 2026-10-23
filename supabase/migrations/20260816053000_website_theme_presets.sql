create table if not exists public.website_theme_settings (
  id boolean primary key default true check (id = true),
  theme_key text not null default 'jv-default',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.website_theme_settings (id, theme_key)
values (true, 'jv-default')
on conflict (id) do nothing;

alter table public.website_theme_settings enable row level security;

drop policy if exists "Public can view website theme" on public.website_theme_settings;
create policy "Public can view website theme"
on public.website_theme_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can update website theme" on public.website_theme_settings;
create policy "Owners can update website theme"
on public.website_theme_settings
for update
to authenticated
using (private.has_staff_role(array['owner','admin']::text[]))
with check (private.has_staff_role(array['owner','admin']::text[]));

drop policy if exists "Owners can insert website theme" on public.website_theme_settings;
create policy "Owners can insert website theme"
on public.website_theme_settings
for insert
to authenticated
with check (private.has_staff_role(array['owner','admin']::text[]));

grant select on public.website_theme_settings to anon, authenticated;
grant insert, update on public.website_theme_settings to authenticated;
