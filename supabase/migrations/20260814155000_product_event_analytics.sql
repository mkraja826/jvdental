create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  surface text not null check (surface in ('public','patient','clinic')),
  actor_type text not null check (actor_type in ('anonymous','patient','staff','system')),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_idx on public.product_events(created_at desc);
create index if not exists product_events_name_idx on public.product_events(event_name, created_at desc);
create index if not exists product_events_surface_idx on public.product_events(surface, created_at desc);

alter table public.product_events enable row level security;

revoke all on public.product_events from anon, authenticated;
grant all on public.product_events to service_role;
grant select on public.product_events to authenticated;

create policy "owner admin reads product analytics"
on public.product_events
for select
to authenticated
using (private.has_staff_role(array['owner','admin']));
