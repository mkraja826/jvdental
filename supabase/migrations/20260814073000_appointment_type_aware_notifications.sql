create or replace function private.appointment_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_label text;
  patient_scheduled_body text;
  patient_rescheduled_body text;
  patient_cancelled_body text;
begin
  appointment_label := case new.appointment_type
    when 'video_consultation' then 'Video consultation'
    when 'clinic_consultation' then 'Clinic appointment'
    when 'procedure' then 'Procedure appointment'
    when 'follow_up' then 'Follow-up appointment'
    else 'Appointment'
  end;

  patient_scheduled_body := case new.appointment_type
    when 'video_consultation' then 'Your JV Dental video consultation has been scheduled. Open your secure portal for the time and joining details.'
    else 'Your JV Dental appointment has been scheduled. Open your secure portal for the confirmed time and details.'
  end;
  patient_rescheduled_body := case new.appointment_type
    when 'video_consultation' then 'Your JV Dental video consultation time has changed. Open your secure portal for the updated time and joining details.'
    else 'Your JV Dental appointment time has changed. Open your secure portal for the updated time and details.'
  end;
  patient_cancelled_body := case new.appointment_type
    when 'video_consultation' then 'Your JV Dental video consultation has been cancelled. The clinic team will contact you if a new time is required.'
    else 'Your JV Dental appointment has been cancelled. The clinic team will contact you if a new time is required.'
  end;

  if tg_op = 'INSERT' and new.status = 'scheduled' then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, new.id, 'consultation_scheduled', appointment_label || ' scheduled', patient_scheduled_body, now(), 'appointment:' || new.id::text || ':scheduled:patient');
    if new.clinician_user_id is not null then
      perform private.enqueue_appointment_notification(new.clinician_user_id, 'staff', new.case_id, new.id, 'consultation_scheduled', appointment_label || ' scheduled', 'A JV Dental patient ' || lower(appointment_label) || ' has been scheduled. Open the clinic portal for details.', now(), 'appointment:' || new.id::text || ':scheduled:staff:' || new.clinician_user_id::text);
    end if;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'cancelled' then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, new.id, 'consultation_cancelled', appointment_label || ' cancelled', patient_cancelled_body, now(), 'appointment:' || new.id::text || ':cancelled:patient');
    if new.clinician_user_id is not null then
      perform private.enqueue_appointment_notification(new.clinician_user_id, 'staff', new.case_id, new.id, 'consultation_cancelled', appointment_label || ' cancelled', 'A JV Dental ' || lower(appointment_label) || ' has been cancelled.', now(), 'appointment:' || new.id::text || ':cancelled:staff:' || new.clinician_user_id::text);
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'scheduled' and old.starts_at is distinct from new.starts_at then
    perform private.enqueue_appointment_notification(new.patient_id, 'patient', new.case_id, new.id, 'consultation_rescheduled', appointment_label || ' rescheduled', patient_rescheduled_body, now(), 'appointment:' || new.id::text || ':rescheduled:' || extract(epoch from new.starts_at)::bigint::text || ':patient');
    if new.clinician_user_id is not null then
      perform private.enqueue_appointment_notification(new.clinician_user_id, 'staff', new.case_id, new.id, 'consultation_rescheduled', appointment_label || ' rescheduled', 'A JV Dental patient ' || lower(appointment_label) || ' time has changed. Open the clinic portal for the updated schedule.', now(), 'appointment:' || new.id::text || ':rescheduled:' || extract(epoch from new.starts_at)::bigint::text || ':staff:' || new.clinician_user_id::text);
    end if;
  end if;
  return new;
end;
$$;

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
  select a.patient_id, 'patient', a.case_id, a.id, 'consultation_reminder_24h',
    case when a.appointment_type = 'video_consultation' then 'Video consultation reminder · 24 hours' else 'Appointment reminder · 24 hours' end,
    case when a.appointment_type = 'video_consultation' then 'Your JV Dental video consultation is approximately 24 hours away. Open your secure portal for joining details.' else 'Your JV Dental appointment is approximately 24 hours away. Open your secure portal for the confirmed time and details.' end,
    now(), 'appointment:' || a.id::text || ':start:' || extract(epoch from a.starts_at)::bigint::text || ':reminder24:patient'
  from public.appointments a where a.status = 'scheduled' and a.starts_at > now() + interval '23 hours' and a.starts_at <= now() + interval '25 hours'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count;
  inserted_count := inserted_count + row_count;

  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.patient_id, 'patient', a.case_id, a.id, 'consultation_reminder_2h',
    case when a.appointment_type = 'video_consultation' then 'Video consultation reminder · 2 hours' else 'Appointment reminder · 2 hours' end,
    case when a.appointment_type = 'video_consultation' then 'Your JV Dental video consultation is approximately 2 hours away. Open your secure portal for the joining link.' else 'Your JV Dental appointment is approximately 2 hours away. Open your secure portal for the confirmed time and details.' end,
    now(), 'appointment:' || a.id::text || ':start:' || extract(epoch from a.starts_at)::bigint::text || ':reminder2:patient'
  from public.appointments a where a.status = 'scheduled' and a.starts_at > now() + interval '90 minutes' and a.starts_at <= now() + interval '150 minutes'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count;
  inserted_count := inserted_count + row_count;

  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.clinician_user_id, 'staff', a.case_id, a.id, 'consultation_reminder_2h',
    case when a.appointment_type = 'video_consultation' then 'Video consultation reminder · 2 hours' else 'Appointment reminder · 2 hours' end,
    case when a.appointment_type = 'video_consultation' then 'A JV Dental video consultation is approximately 2 hours away. Open the clinic portal for details.' else 'A JV Dental appointment is approximately 2 hours away. Open the clinic portal for details.' end,
    now(), 'appointment:' || a.id::text || ':start:' || extract(epoch from a.starts_at)::bigint::text || ':reminder2:staff:' || a.clinician_user_id::text
  from public.appointments a where a.status = 'scheduled' and a.clinician_user_id is not null and a.starts_at > now() + interval '90 minutes' and a.starts_at <= now() + interval '150 minutes'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count;
  inserted_count := inserted_count + row_count;

  return inserted_count;
end;
$$;
