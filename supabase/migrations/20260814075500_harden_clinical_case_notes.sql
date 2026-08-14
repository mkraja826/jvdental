drop policy if exists "case notes staff only" on public.case_notes;

create policy "clinical staff reads case notes"
on public.case_notes
for select
to authenticated
using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

create policy "clinical staff inserts case notes"
on public.case_notes
for insert
to authenticated
with check (
  private.has_staff_role(array['owner','admin','implantologist','doctor'])
  and author_user_id = (select auth.uid())
);

create policy "clinical staff updates own case notes"
on public.case_notes
for update
to authenticated
using (
  private.has_staff_role(array['owner','admin','implantologist','doctor'])
  and author_user_id = (select auth.uid())
)
with check (
  private.has_staff_role(array['owner','admin','implantologist','doctor'])
  and author_user_id = (select auth.uid())
);

create policy "clinical admins delete case notes"
on public.case_notes
for delete
to authenticated
using (private.has_staff_role(array['owner','admin']));
