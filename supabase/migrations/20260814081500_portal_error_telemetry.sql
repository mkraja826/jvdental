create table if not exists public.portal_error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  surface text not null check (surface in ('patient','clinic')),
  route text not null,
  error_name text,
  error_digest text not null,
  created_at timestamptz not null default now()
);

create index if not exists portal_error_events_created_idx on public.portal_error_events(created_at desc);
create index if not exists portal_error_events_surface_idx on public.portal_error_events(surface, created_at desc);

alter table public.portal_error_events enable row level security;

revoke all on public.portal_error_events from anon, authenticated;
grant all on public.portal_error_events to service_role;
grant select on public.portal_error_events to authenticated;

create policy "owner admin reads portal errors"
on public.portal_error_events
for select
to authenticated
using (private.has_staff_role(array['owner','admin']));
