alter table public.notifications drop constraint if exists notifications_event_type_check;
alter table public.notifications add constraint notifications_event_type_check check (
  event_type in (
    'consultation_scheduled','consultation_rescheduled','consultation_cancelled','consultation_reminder_24h','consultation_reminder_2h',
    'treatment_plan_sent','treatment_plan_response','travel_update','records_received',
    'new_patient_message','new_staff_message','new_patient_document',
    'inventory_low_stock','inventory_expiry_30d'
  )
);

create or replace function private.appointment_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'scheduled' then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, new.id, 'consultation_scheduled', 'Video consultation scheduled', 'Your JV Dental video consultation has been scheduled. Open your secure portal for the time and joining details.', now(), 'appointment:' || new.id::text || ':scheduled:patient');
    if new.clinician_user_id is not null then
      perform private.enqueue_appointment_notification(new.clinician_user_id, 'staff', new.case_id, new.id, 'consultation_scheduled', 'Video consultation scheduled', 'A JV Dental patient video consultation has been scheduled. Open the clinic portal for details.', now(), 'appointment:' || new.id::text || ':scheduled:staff:' || new.clinician_user_id::text);
    end if;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'cancelled' then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, new.id, 'consultation_cancelled', 'Video consultation cancelled', 'Your JV Dental video consultation has been cancelled. The clinic team will contact you if a new time is required.', now(), 'appointment:' || new.id::text || ':cancelled:patient');
    if new.clinician_user_id is not null then
      perform private.enqueue_appointment_notification(new.clinician_user_id, 'staff', new.case_id, new.id, 'consultation_cancelled', 'Video consultation cancelled', 'A JV Dental video consultation has been cancelled.', now(), 'appointment:' || new.id::text || ':cancelled:staff:' || new.clinician_user_id::text);
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'scheduled' and old.starts_at is distinct from new.starts_at then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, new.id, 'consultation_rescheduled', 'Video consultation rescheduled', 'Your JV Dental video consultation time has changed. Open your secure portal for the updated time and joining details.', now(), 'appointment:' || new.id::text || ':rescheduled:' || extract(epoch from new.starts_at)::bigint::text || ':patient');
    if new.clinician_user_id is not null then
      perform private.enqueue_appointment_notification(new.clinician_user_id, 'staff', new.case_id, new.id, 'consultation_rescheduled', 'Video consultation rescheduled', 'A JV Dental patient video consultation time has changed. Open the clinic portal for the updated schedule.', now(), 'appointment:' || new.id::text || ':rescheduled:' || extract(epoch from new.starts_at)::bigint::text || ':staff:' || new.clinician_user_id::text);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appointment_notification_events on public.appointments;
create trigger appointment_notification_events after insert or update of status, starts_at on public.appointments for each row execute function private.appointment_notification_trigger();

create or replace function public.enqueue_due_consultation_reminders()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer := 0;
  row_count integer;
begin
  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.patient_id, 'patient', a.case_id, a.id, 'consultation_reminder_24h', 'Consultation reminder · 24 hours', 'Your JV Dental video consultation is approximately 24 hours away. Open your secure portal for joining details.', now(), 'appointment:' || a.id::text || ':start:' || extract(epoch from a.starts_at)::bigint::text || ':reminder24:patient'
  from public.appointments a where a.status = 'scheduled' and a.starts_at > now() + interval '23 hours' and a.starts_at <= now() + interval '25 hours'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count;
  inserted_count := inserted_count + row_count;

  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.patient_id, 'patient', a.case_id, a.id, 'consultation_reminder_2h', 'Consultation reminder · 2 hours', 'Your JV Dental video consultation is approximately 2 hours away. Open your secure portal for the joining link.', now(), 'appointment:' || a.id::text || ':start:' || extract(epoch from a.starts_at)::bigint::text || ':reminder2:patient'
  from public.appointments a where a.status = 'scheduled' and a.starts_at > now() + interval '90 minutes' and a.starts_at <= now() + interval '150 minutes'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count;
  inserted_count := inserted_count + row_count;

  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.clinician_user_id, 'staff', a.case_id, a.id, 'consultation_reminder_2h', 'Consultation reminder · 2 hours', 'A JV Dental video consultation is approximately 2 hours away. Open the clinic portal for details.', now(), 'appointment:' || a.id::text || ':start:' || extract(epoch from a.starts_at)::bigint::text || ':reminder2:staff:' || a.clinician_user_id::text
  from public.appointments a where a.status = 'scheduled' and a.clinician_user_id is not null and a.starts_at > now() + interval '90 minutes' and a.starts_at <= now() + interval '150 minutes'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count;
  inserted_count := inserted_count + row_count;

  return inserted_count;
end;
$$;
