alter table public.notifications drop constraint if exists notifications_event_type_check;
alter table public.notifications add constraint notifications_event_type_check check (
  event_type in (
    'consultation_scheduled','consultation_cancelled','consultation_reminder_24h','consultation_reminder_2h',
    'treatment_plan_sent','treatment_plan_response','travel_update','records_received',
    'new_patient_message','new_staff_message','new_patient_document',
    'inventory_low_stock','inventory_expiry_30d'
  )
);

revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;

create or replace function private.enqueue_case_staff_notification(
  p_case_id uuid,
  p_event_type text,
  p_title text,
  p_body text,
  p_dedupe_suffix text,
  p_include_clinician boolean default true,
  p_include_coordinator boolean default true
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.patient_cases%rowtype;
  s record;
begin
  select * into c from public.patient_cases where id = p_case_id;
  if not found then return; end if;

  if p_include_clinician and c.assigned_clinician is not null then
    perform private.enqueue_appointment_notification(c.assigned_clinician, 'staff', c.id, null, p_event_type, p_title, p_body, now(), 'case:' || c.id::text || ':' || p_dedupe_suffix || ':clinician:' || c.assigned_clinician::text);
  end if;

  if p_include_coordinator and c.assigned_coordinator is not null and c.assigned_coordinator is distinct from c.assigned_clinician then
    perform private.enqueue_appointment_notification(c.assigned_coordinator, 'staff', c.id, null, p_event_type, p_title, p_body, now(), 'case:' || c.id::text || ':' || p_dedupe_suffix || ':coordinator:' || c.assigned_coordinator::text);
  elsif p_include_coordinator and c.assigned_coordinator is null then
    for s in select user_id from public.staff_profiles where is_active = true and role = 'coordinator'
    loop
      perform private.enqueue_appointment_notification(s.user_id, 'staff', c.id, null, p_event_type, p_title, p_body, now(), 'case:' || c.id::text || ':' || p_dedupe_suffix || ':coordinator:' || s.user_id::text);
    end loop;
  end if;
end;
$$;
revoke all on function private.enqueue_case_staff_notification(uuid,text,text,text,text,boolean,boolean) from public;

create or replace function private.patient_document_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.case_id is not null and new.uploaded_by = new.patient_id then
    perform private.enqueue_case_staff_notification(new.case_id, 'new_patient_document', 'New patient record uploaded', 'A patient has uploaded a new record. Open the secure clinical review workspace to view it.', 'document:' || new.id::text, true, true);
  end if;
  return new;
end;
$$;
revoke all on function private.patient_document_notification_trigger() from public;
drop trigger if exists patient_document_notification on public.patient_documents;
create trigger patient_document_notification after insert on public.patient_documents for each row execute function private.patient_document_notification_trigger();

create or replace function private.message_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.conversations%rowtype;
begin
  if new.is_internal then return new; end if;
  select * into conv from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  if new.sender_user_id = conv.patient_id then
    if conv.case_id is not null then
      perform private.enqueue_case_staff_notification(conv.case_id, 'new_patient_message', 'New patient message', 'A patient sent a secure message. Open the clinic inbox to respond.', 'message:' || new.id::text, true, true);
    end if;
  else
    perform private.enqueue_appointment_notification(conv.patient_id, 'patient', conv.case_id, null, 'new_staff_message', 'New message from JV Dental', 'The JV Dental team sent you a secure message. Open your patient portal to read it.', now(), 'message:' || new.id::text || ':patient');
  end if;
  return new;
end;
$$;
revoke all on function private.message_notification_trigger() from public;
drop trigger if exists secure_message_notification on public.messages;
create trigger secure_message_notification after insert on public.messages for each row execute function private.message_notification_trigger();

create or replace function private.treatment_plan_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status then return new; end if;

  if new.status = 'sent' then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, null, 'treatment_plan_sent', 'Treatment plan ready', 'Your preliminary JV Dental treatment plan is ready in your secure patient portal.', now(), 'plan:' || new.id::text || ':sent:patient');
  elsif new.status in ('accepted','requested_changes') then
    if new.created_by is not null then
      perform private.enqueue_appointment_notification(new.created_by, 'staff', new.case_id, null, 'treatment_plan_response', case when new.status = 'accepted' then 'Treatment plan accepted' else 'Treatment plan changes requested' end, case when new.status = 'accepted' then 'A patient accepted a treatment plan.' else 'A patient requested changes to a treatment plan.' end, now(), 'plan:' || new.id::text || ':' || new.status || ':creator:' || new.created_by::text);
    end if;
    if new.case_id is not null then
      perform private.enqueue_case_staff_notification(new.case_id, 'treatment_plan_response', case when new.status = 'accepted' then 'Treatment plan accepted' else 'Treatment plan changes requested' end, case when new.status = 'accepted' then 'A patient accepted a treatment plan.' else 'A patient requested changes to a treatment plan.' end, 'plan:' || new.id::text || ':' || new.status, false, true);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.treatment_plan_notification_trigger() from public;
drop trigger if exists treatment_plan_notification on public.treatment_plans;
create trigger treatment_plan_notification after update of status on public.treatment_plans for each row execute function private.treatment_plan_notification_trigger();

create or replace function private.travel_plan_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    if new.status = 'details_submitted' then
      perform private.enqueue_case_staff_notification(new.case_id, 'travel_update', 'International travel details submitted', 'A patient submitted travel details. Open the travel coordination workspace to review them.', 'travel:' || new.id::text || ':details_submitted', false, true);
    elsif new.status = 'confirmed' then
      perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, null, 'travel_update', 'Travel details confirmed', 'JV Dental has confirmed your submitted travel details. Open your secure portal for the latest plan.', now(), 'travel:' || new.id::text || ':confirmed:patient');
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.travel_plan_notification_trigger() from public;
drop trigger if exists travel_plan_notification on public.travel_plans;
create trigger travel_plan_notification after insert or update of status on public.travel_plans for each row execute function private.travel_plan_notification_trigger();

create or replace function public.enqueue_inventory_alerts()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer := 0;
  row_count integer;
  staff_row record;
  item_row record;
  day_key text := to_char(current_date, 'YYYY-MM-DD');
begin
  for item_row in
    select i.id, i.name, i.min_stock, coalesce(sum(b.quantity_on_hand), 0)::integer as on_hand
    from public.inventory_items i
    left join public.inventory_batches b on b.item_id = i.id
    where i.is_active = true
    group by i.id, i.name, i.min_stock
    having coalesce(sum(b.quantity_on_hand), 0) <= i.min_stock
  loop
    for staff_row in select user_id from public.staff_profiles where is_active = true and role in ('owner','admin')
    loop
      insert into public.notifications(recipient_user_id, recipient_type, event_type, title, body, delivery_status, dedupe_key, metadata)
      values (staff_row.user_id, 'staff', 'inventory_low_stock', 'Inventory below minimum', 'An inventory item is at or below its minimum stock level. Open Inventory for details.', 'sent', 'inventory:low:' || item_row.id::text || ':' || day_key || ':' || staff_row.user_id::text, jsonb_build_object('inventory_item_id', item_row.id, 'on_hand', item_row.on_hand, 'min_stock', item_row.min_stock))
      on conflict (dedupe_key) do nothing;
      get diagnostics row_count = row_count;
      inserted_count := inserted_count + row_count;
    end loop;
  end loop;

  for item_row in
    select b.id as batch_id, b.item_id, b.expiry_date
    from public.inventory_batches b
    where b.quantity_on_hand > 0 and b.expiry_date is not null and b.expiry_date between current_date and current_date + 30
  loop
    for staff_row in select user_id from public.staff_profiles where is_active = true and role in ('owner','admin')
    loop
      insert into public.notifications(recipient_user_id, recipient_type, event_type, title, body, delivery_status, dedupe_key, metadata)
      values (staff_row.user_id, 'staff', 'inventory_expiry_30d', 'Inventory expiry approaching', 'An inventory batch expires within 30 days. Open Inventory for batch and FEFO details.', 'sent', 'inventory:expiry:' || item_row.batch_id::text || ':' || day_key || ':' || staff_row.user_id::text, jsonb_build_object('inventory_item_id', item_row.item_id, 'inventory_batch_id', item_row.batch_id, 'expiry_date', item_row.expiry_date))
      on conflict (dedupe_key) do nothing;
      get diagnostics row_count = row_count;
      inserted_count := inserted_count + row_count;
    end loop;
  end loop;
  return inserted_count;
end;
$$;
revoke all on function public.enqueue_inventory_alerts() from public, anon, authenticated;
grant execute on function public.enqueue_inventory_alerts() to service_role;

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'jv-consultation-reminders';
  if job_id is not null then perform cron.unschedule(job_id); end if;
  perform cron.schedule('jv-consultation-reminders', '*/15 * * * *', 'select public.enqueue_due_consultation_reminders();');

  select jobid into job_id from cron.job where jobname = 'jv-inventory-alerts';
  if job_id is not null then perform cron.unschedule(job_id); end if;
  perform cron.schedule('jv-inventory-alerts', '30 2 * * *', 'select public.enqueue_inventory_alerts();');
end $$;
