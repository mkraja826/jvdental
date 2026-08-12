alter policy "appointment patient or staff read" on public.appointments
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "staff appends audit" on public.audit_logs
  with check (private.is_active_staff() and (actor_user_id = (select auth.uid())));

alter policy "content staff manages blogs" on public.blog_posts
  using (private.has_staff_role(array['owner'::text,'admin'::text,'implantologist'::text,'doctor'::text]))
  with check (private.has_staff_role(array['owner'::text,'admin'::text,'implantologist'::text,'doctor'::text]) and (author_user_id = (select auth.uid())));

alter policy "case notes staff only" on public.case_notes
  using (private.is_active_staff())
  with check (private.is_active_staff() and (author_user_id = (select auth.uid())));

alter policy "case history patient or staff read" on public.case_status_history
  using (private.is_active_staff() or exists (
    select 1 from public.patient_cases pc
    where pc.id = case_status_history.case_id and pc.patient_id = (select auth.uid())
  ));

alter policy "staff writes case history" on public.case_status_history
  with check (private.is_active_staff() and ((changed_by = (select auth.uid())) or changed_by is null));

alter policy "conversation patient creates own" on public.conversations
  with check ((patient_id = (select auth.uid())) and (
    case_id is null or exists (
      select 1 from public.patient_cases pc
      where pc.id = conversations.case_id and pc.patient_id = (select auth.uid())
    )
  ));

alter policy "conversation patient or staff read" on public.conversations
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "dental intake patient creates own" on public.dental_intakes
  with check (patient_id = (select auth.uid()));

alter policy "dental intake patient or staff read" on public.dental_intakes
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "dental intake patient or staff update" on public.dental_intakes
  using ((patient_id = (select auth.uid())) or private.is_active_staff())
  with check ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "implant passport patient or staff read" on public.implant_records
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "medical history patient creates own" on public.medical_histories
  with check (patient_id = (select auth.uid()));

alter policy "medical history patient or staff read" on public.medical_histories
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "medical history patient or staff update" on public.medical_histories
  using ((patient_id = (select auth.uid())) or private.is_active_staff())
  with check ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "message attachment participant insert" on public.message_attachments
  with check (exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and m.sender_user_id = (select auth.uid())
      and (c.patient_id = (select auth.uid()) or private.is_active_staff())
  ));

alter policy "message attachment participant read" on public.message_attachments
  using (exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and (c.patient_id = (select auth.uid()) or private.is_active_staff())
  ));

alter policy "message participant insert" on public.messages
  with check ((sender_user_id = (select auth.uid())) and (
    private.is_active_staff() or (
      is_internal = false and exists (
        select 1 from public.conversations c
        where c.id = messages.conversation_id and c.patient_id = (select auth.uid())
      )
    )
  ));

alter policy "message participant read" on public.messages
  using (private.is_active_staff() or (
    is_internal = false and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.patient_id = (select auth.uid())
    )
  ));

alter policy "case patient or staff read" on public.patient_cases
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "patient creates own case" on public.patient_cases
  with check ((patient_id = (select auth.uid())) and status = 'new'::text);

alter policy "document metadata patient or staff read" on public.patient_documents
  using ((patient_id = (select auth.uid())) or private.is_active_staff());

alter policy "patient uploads own document metadata" on public.patient_documents
  with check ((patient_id = (select auth.uid())) and (uploaded_by = (select auth.uid())) and (
    case_id is null or exists (
      select 1 from public.patient_cases pc
      where pc.id = patient_documents.case_id and pc.patient_id = (select auth.uid())
    )
  ));

alter policy "staff uploads document metadata" on public.patient_documents
  with check (private.is_active_staff() and (uploaded_by = (select auth.uid())));

alter policy "patient creates own profile" on public.patient_profiles
  with check (user_id = (select auth.uid()));

alter policy "patient or staff updates profile" on public.patient_profiles
  using ((user_id = (select auth.uid())) or private.is_active_staff())
  with check ((user_id = (select auth.uid())) or private.is_active_staff());

alter policy "patient profile self or staff read" on public.patient_profiles
  using ((user_id = (select auth.uid())) or private.is_active_staff());

alter policy "staff profile self or staff read" on public.staff_profiles
  using ((user_id = (select auth.uid())) or private.is_active_staff());

alter policy "treatment plan items patient or staff read" on public.treatment_plan_items
  using (private.is_active_staff() or exists (
    select 1 from public.treatment_plans tp
    where tp.id = treatment_plan_items.treatment_plan_id and tp.patient_id = (select auth.uid())
  ));

alter policy "treatment plan patient or staff read" on public.treatment_plans
  using ((patient_id = (select auth.uid())) or private.is_active_staff());
