create index if not exists appointment_requests_managed_by_idx
  on public.appointment_requests(managed_by);

create index if not exists booking_payments_appointment_request_idx
  on public.booking_payments(appointment_request_id);

create index if not exists portal_error_events_user_idx
  on public.portal_error_events(user_id);

create index if not exists product_events_actor_user_idx
  on public.product_events(actor_user_id);

drop policy if exists "admin inserts nonprivileged staff" on public.staff_profiles;
drop policy if exists "owner inserts staff" on public.staff_profiles;
drop policy if exists "admin updates nonprivileged staff" on public.staff_profiles;
drop policy if exists "owner updates staff" on public.staff_profiles;
drop policy if exists "admin deletes nonprivileged staff" on public.staff_profiles;
drop policy if exists "owner deletes staff" on public.staff_profiles;

create policy "owner admin insert staff"
on public.staff_profiles
for insert
to authenticated
with check (
  private.has_staff_role(array['owner'])
  or (
    private.has_staff_role(array['admin'])
    and role <> all (array['owner'::text, 'admin'::text])
  )
);

create policy "owner admin update staff"
on public.staff_profiles
for update
to authenticated
using (
  private.has_staff_role(array['owner'])
  or (
    private.has_staff_role(array['admin'])
    and role <> all (array['owner'::text, 'admin'::text])
  )
)
with check (
  private.has_staff_role(array['owner'])
  or (
    private.has_staff_role(array['admin'])
    and role <> all (array['owner'::text, 'admin'::text])
  )
);

create policy "owner admin delete staff"
on public.staff_profiles
for delete
to authenticated
using (
  private.has_staff_role(array['owner'])
  or (
    private.has_staff_role(array['admin'])
    and role <> all (array['owner'::text, 'admin'::text])
  )
);
