-- Preserve access semantics while avoiding multiple permissive policies per role/action.

-- Appointments.
drop policy if exists "staff manages appointments" on public.appointments;
create policy "staff inserts appointments" on public.appointments for insert to authenticated with check (private.is_active_staff());
create policy "staff updates appointments" on public.appointments for update to authenticated using (private.is_active_staff()) with check (private.is_active_staff());
create policy "staff deletes appointments" on public.appointments for delete to authenticated using (private.is_active_staff());

-- Assistant knowledge.
drop policy if exists "clinical content staff manages assistant knowledge" on public.assistant_knowledge;
create policy "clinical staff inserts assistant knowledge" on public.assistant_knowledge for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff updates assistant knowledge" on public.assistant_knowledge for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff deletes assistant knowledge" on public.assistant_knowledge for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

-- Blog posts.
drop policy if exists "content staff manages blogs" on public.blog_posts;
create policy "clinical authors insert blogs" on public.blog_posts for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','doctor']) and author_user_id = (select auth.uid()));
create policy "clinical authors update blogs" on public.blog_posts for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']) and author_user_id = (select auth.uid()));
create policy "clinical authors delete blogs" on public.blog_posts for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

-- Blog publication records.
drop policy if exists "content staff manages blog publications" on public.blog_publications;
create policy "clinical staff inserts blog publications" on public.blog_publications for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff updates blog publications" on public.blog_publications for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff deletes blog publications" on public.blog_publications for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

-- Clinic technologies.
drop policy if exists "owner admin manages technologies" on public.clinic_technologies;
create policy "owner admin inserts technologies" on public.clinic_technologies for insert to authenticated with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin updates technologies" on public.clinic_technologies for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin deletes technologies" on public.clinic_technologies for delete to authenticated using (private.has_staff_role(array['owner','admin']));

-- Conversations.
drop policy if exists "conversation patient creates own" on public.conversations;
drop policy if exists "conversation staff creates" on public.conversations;
create policy "patient or staff creates conversation" on public.conversations for insert to authenticated
with check (private.is_active_staff() or (patient_id = (select auth.uid()) and (case_id is null or exists (select 1 from public.patient_cases pc where pc.id = conversations.case_id and pc.patient_id = (select auth.uid())))));

-- Doctor profiles.
drop policy if exists "owner admin manage doctor profiles" on public.doctor_profiles;
drop policy if exists "public reads published doctor profiles" on public.doctor_profiles;
drop policy if exists "staff reads all doctor profiles" on public.doctor_profiles;
create policy "public or staff reads doctor profiles" on public.doctor_profiles for select to anon, authenticated using (status = 'published' or private.is_active_staff());
create policy "owner admin inserts doctor profiles" on public.doctor_profiles for insert to authenticated with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin updates doctor profiles" on public.doctor_profiles for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin deletes doctor profiles" on public.doctor_profiles for delete to authenticated using (private.has_staff_role(array['owner','admin']));

-- Doctor qualifications.
drop policy if exists "owner admin manage doctor qualifications" on public.doctor_qualifications;
drop policy if exists "public reads published doctor qualifications" on public.doctor_qualifications;
drop policy if exists "staff reads all doctor qualifications" on public.doctor_qualifications;
create policy "public or staff reads doctor qualifications" on public.doctor_qualifications for select to anon, authenticated using (private.is_active_staff() or exists (select 1 from public.doctor_profiles dp where dp.id = doctor_qualifications.doctor_profile_id and dp.status = 'published'));
create policy "owner admin inserts doctor qualifications" on public.doctor_qualifications for insert to authenticated with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin updates doctor qualifications" on public.doctor_qualifications for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin deletes doctor qualifications" on public.doctor_qualifications for delete to authenticated using (private.has_staff_role(array['owner','admin']));

-- Doctor memberships.
drop policy if exists "owner admin manage doctor memberships" on public.doctor_memberships;
drop policy if exists "public reads published doctor memberships" on public.doctor_memberships;
drop policy if exists "staff reads all doctor memberships" on public.doctor_memberships;
create policy "public or staff reads doctor memberships" on public.doctor_memberships for select to anon, authenticated using (private.is_active_staff() or exists (select 1 from public.doctor_profiles dp where dp.id = doctor_memberships.doctor_profile_id and dp.status = 'published'));
create policy "owner admin inserts doctor memberships" on public.doctor_memberships for insert to authenticated with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin updates doctor memberships" on public.doctor_memberships for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin deletes doctor memberships" on public.doctor_memberships for delete to authenticated using (private.has_staff_role(array['owner','admin']));

-- Doctor external links.
drop policy if exists "owner admin manage doctor external links" on public.doctor_external_links;
drop policy if exists "public reads published doctor external links" on public.doctor_external_links;
drop policy if exists "staff reads all doctor external links" on public.doctor_external_links;
create policy "public or staff reads doctor external links" on public.doctor_external_links for select to anon, authenticated using (private.is_active_staff() or exists (select 1 from public.doctor_profiles dp where dp.id = doctor_external_links.doctor_profile_id and dp.status = 'published'));
create policy "owner admin inserts doctor external links" on public.doctor_external_links for insert to authenticated with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin updates doctor external links" on public.doctor_external_links for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin deletes doctor external links" on public.doctor_external_links for delete to authenticated using (private.has_staff_role(array['owner','admin']));

-- Inventory catalogue and batches.
drop policy if exists "inventory editors manage items" on public.inventory_items;
create policy "inventory editors insert items" on public.inventory_items for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','dental_assistant']));
create policy "inventory editors update items" on public.inventory_items for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','dental_assistant'])) with check (private.has_staff_role(array['owner','admin','implantologist','dental_assistant']));
create policy "inventory editors delete items" on public.inventory_items for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','dental_assistant']));

drop policy if exists "inventory editors manage batches" on public.inventory_batches;
create policy "inventory editors insert batches" on public.inventory_batches for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','dental_assistant']));
create policy "inventory editors update batches" on public.inventory_batches for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','dental_assistant'])) with check (private.has_staff_role(array['owner','admin','implantologist','dental_assistant']));
create policy "inventory editors delete batches" on public.inventory_batches for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','dental_assistant']));

-- Patient case inserts.
drop policy if exists "patient creates own case" on public.patient_cases;
drop policy if exists "staff creates cases" on public.patient_cases;
create policy "patient or staff creates case" on public.patient_cases for insert to authenticated with check (private.is_active_staff() or (patient_id = (select auth.uid()) and status = 'new'));

-- Patient document inserts.
drop policy if exists "patient uploads own document metadata" on public.patient_documents;
drop policy if exists "staff uploads document metadata" on public.patient_documents;
create policy "patient or staff uploads document metadata" on public.patient_documents for insert to authenticated
with check ((private.is_active_staff() and uploaded_by = (select auth.uid())) or (patient_id = (select auth.uid()) and uploaded_by = (select auth.uid()) and (case_id is null or exists (select 1 from public.patient_cases pc where pc.id = patient_documents.case_id and pc.patient_id = (select auth.uid())))));

-- Finance reads.
drop policy if exists "patient reads own payment attempts" on public.payment_attempts;
drop policy if exists "staff reads payment attempts" on public.payment_attempts;
create policy "patient or staff reads payment attempts" on public.payment_attempts for select to authenticated using (patient_id = (select auth.uid()) or private.is_active_staff());

drop policy if exists "patient reads own receipts" on public.payment_receipts;
drop policy if exists "staff reads receipts" on public.payment_receipts;
create policy "patient or staff reads receipts" on public.payment_receipts for select to authenticated using (private.is_active_staff() or exists (select 1 from public.payments p where p.id = payment_receipts.payment_id and p.patient_id = (select auth.uid())));

drop policy if exists "patient reads own refunds" on public.payment_refunds;
drop policy if exists "staff reads refunds" on public.payment_refunds;
create policy "patient or staff reads refunds" on public.payment_refunds for select to authenticated using (private.is_active_staff() or exists (select 1 from public.payments p where p.id = payment_refunds.payment_id and p.patient_id = (select auth.uid())));

drop policy if exists "patient reads own payment requests" on public.payment_requests;
drop policy if exists "staff reads payment requests" on public.payment_requests;
create policy "patient or staff reads payment requests" on public.payment_requests for select to authenticated using (patient_id = (select auth.uid()) or private.is_active_staff());

drop policy if exists "patient reads own payments" on public.payments;
drop policy if exists "staff reads payments" on public.payments;
create policy "patient or staff reads payments" on public.payments for select to authenticated using (patient_id = (select auth.uid()) or private.is_active_staff());

-- Purchase orders.
drop policy if exists "inventory editors manage purchase orders" on public.purchase_orders;
create policy "inventory editors insert purchase orders" on public.purchase_orders for insert to authenticated with check (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
create policy "inventory editors update purchase orders" on public.purchase_orders for update to authenticated using (private.has_staff_role(array['owner','admin','receptionist','dental_assistant'])) with check (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
create policy "inventory editors delete purchase orders" on public.purchase_orders for delete to authenticated using (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));

drop policy if exists "inventory editors manage purchase order items" on public.purchase_order_items;
create policy "inventory editors insert purchase order items" on public.purchase_order_items for insert to authenticated with check (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
create policy "inventory editors update purchase order items" on public.purchase_order_items for update to authenticated using (private.has_staff_role(array['owner','admin','receptionist','dental_assistant'])) with check (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
create policy "inventory editors delete purchase order items" on public.purchase_order_items for delete to authenticated using (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));

-- Signature cases.
drop policy if exists "clinical staff manages signature cases" on public.signature_cases;
create policy "clinical staff inserts signature cases" on public.signature_cases for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff updates signature cases" on public.signature_cases for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff deletes signature cases" on public.signature_cases for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

drop policy if exists "clinical staff manages case stages" on public.signature_case_stages;
create policy "clinical staff inserts case stages" on public.signature_case_stages for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff updates case stages" on public.signature_case_stages for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff deletes case stages" on public.signature_case_stages for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

drop policy if exists "clinical staff manages case media" on public.signature_case_media;
create policy "clinical staff inserts case media" on public.signature_case_media for insert to authenticated with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff updates case media" on public.signature_case_media for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "clinical staff deletes case media" on public.signature_case_media for delete to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']));

-- Staff directory.
drop policy if exists "owner admin manage staff" on public.staff_profiles;
create policy "owner admin inserts staff" on public.staff_profiles for insert to authenticated with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin updates staff" on public.staff_profiles for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "owner admin deletes staff" on public.staff_profiles for delete to authenticated using (private.has_staff_role(array['owner','admin']));

-- Travel plans.
drop policy if exists "staff manages travel plans" on public.travel_plans;
drop policy if exists "patient creates own travel plan" on public.travel_plans;
drop policy if exists "patient updates own unconfirmed travel plan" on public.travel_plans;
create policy "patient or staff creates travel plan" on public.travel_plans for insert to authenticated
with check (private.is_active_staff() or (patient_id = (select auth.uid()) and status = any(array['planning'::text,'details_submitted'::text]) and exists (select 1 from public.patient_cases pc where pc.id = travel_plans.case_id and pc.patient_id = (select auth.uid()))));
create policy "patient or staff updates travel plan" on public.travel_plans for update to authenticated
using (private.is_active_staff() or (patient_id = (select auth.uid()) and status = any(array['planning'::text,'details_submitted'::text])))
with check (private.is_active_staff() or (patient_id = (select auth.uid()) and status = any(array['planning'::text,'details_submitted'::text]) and confirmed_by is null and confirmed_at is null and exists (select 1 from public.patient_cases pc where pc.id = travel_plans.case_id and pc.patient_id = (select auth.uid()))));
create policy "staff deletes travel plans" on public.travel_plans for delete to authenticated using (private.is_active_staff());

-- Treatment plan feedback.
drop policy if exists "staff reads treatment plan feedback" on public.treatment_plan_feedback;

-- Treatment plans and items.
drop policy if exists "staff manages treatment plans" on public.treatment_plans;
create policy "staff inserts treatment plans" on public.treatment_plans for insert to authenticated with check (private.is_active_staff());
create policy "staff updates treatment plans" on public.treatment_plans for update to authenticated using (private.is_active_staff()) with check (private.is_active_staff());
create policy "staff deletes treatment plans" on public.treatment_plans for delete to authenticated using (private.is_active_staff());

drop policy if exists "staff manages treatment plan items" on public.treatment_plan_items;
create policy "staff inserts treatment plan items" on public.treatment_plan_items for insert to authenticated with check (private.is_active_staff());
create policy "staff updates treatment plan items" on public.treatment_plan_items for update to authenticated using (private.is_active_staff()) with check (private.is_active_staff());
create policy "staff deletes treatment plan items" on public.treatment_plan_items for delete to authenticated using (private.is_active_staff());

-- Vendors.
drop policy if exists "inventory editors manage vendors" on public.vendors;
create policy "inventory editors insert vendors" on public.vendors for insert to authenticated with check (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
create policy "inventory editors update vendors" on public.vendors for update to authenticated using (private.has_staff_role(array['owner','admin','receptionist','dental_assistant'])) with check (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
create policy "inventory editors delete vendors" on public.vendors for delete to authenticated using (private.has_staff_role(array['owner','admin','receptionist','dental_assistant']));
