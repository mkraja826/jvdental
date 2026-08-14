drop policy if exists "staff inserts treatment plans" on public.treatment_plans;
drop policy if exists "staff updates treatment plans" on public.treatment_plans;
drop policy if exists "staff deletes treatment plans" on public.treatment_plans;

create policy "clinical staff inserts treatment plans"
on public.treatment_plans
for insert
to authenticated
with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));

create policy "clinical staff updates treatment plans"
on public.treatment_plans
for update
to authenticated
using (private.has_staff_role(array['owner','admin','implantologist','doctor']))
with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));

create policy "clinical staff deletes treatment plans"
on public.treatment_plans
for delete
to authenticated
using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

drop policy if exists "staff inserts treatment plan items" on public.treatment_plan_items;
drop policy if exists "staff updates treatment plan items" on public.treatment_plan_items;
drop policy if exists "staff deletes treatment plan items" on public.treatment_plan_items;

create policy "clinical staff inserts treatment plan items"
on public.treatment_plan_items
for insert
to authenticated
with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));

create policy "clinical staff updates treatment plan items"
on public.treatment_plan_items
for update
to authenticated
using (private.has_staff_role(array['owner','admin','implantologist','doctor']))
with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));

create policy "clinical staff deletes treatment plan items"
on public.treatment_plan_items
for delete
to authenticated
using (private.has_staff_role(array['owner','admin','implantologist','doctor']));
