drop policy if exists "owner admin inserts staff" on public.staff_profiles;
drop policy if exists "owner admin updates staff" on public.staff_profiles;
drop policy if exists "owner admin deletes staff" on public.staff_profiles;

create policy "owner inserts staff"
on public.staff_profiles
for insert
to authenticated
with check (private.has_staff_role(array['owner']));

create policy "admin inserts nonprivileged staff"
on public.staff_profiles
for insert
to authenticated
with check (
  private.has_staff_role(array['admin'])
  and role not in ('owner','admin')
);

create policy "owner updates staff"
on public.staff_profiles
for update
to authenticated
using (private.has_staff_role(array['owner']))
with check (private.has_staff_role(array['owner']));

create policy "admin updates nonprivileged staff"
on public.staff_profiles
for update
to authenticated
using (
  private.has_staff_role(array['admin'])
  and role not in ('owner','admin')
)
with check (
  private.has_staff_role(array['admin'])
  and role not in ('owner','admin')
);

create policy "owner deletes staff"
on public.staff_profiles
for delete
to authenticated
using (private.has_staff_role(array['owner']));

create policy "admin deletes nonprivileged staff"
on public.staff_profiles
for delete
to authenticated
using (
  private.has_staff_role(array['admin'])
  and role not in ('owner','admin')
);
