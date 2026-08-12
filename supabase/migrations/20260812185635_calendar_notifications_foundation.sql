create table public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google' check (provider in ('google')),
  connected_by uuid references public.staff_profiles(user_id) on delete set null,
  calendar_id text not null default 'primary',
  account_email text,
  calendar_summary text,
  scopes text[] not null default '{}',
  status text not null default 'connected' check (status in ('connected','disconnected','error')),
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index calendar_integrations_one_active_google_idx on public.calendar_integrations(provider) where status = 'connected';

create table public.calendar_integration_secrets (
  integration_id uuid primary key references public.calendar_integrations(id) on delete cascade,
  refresh_token_ciphertext text not null,
  refresh_token_iv text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.google_oauth_states (
  state_hash text primary key,
  requested_by uuid not null references public.staff_profiles(user_id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists calendar_integration_id uuid references public.calendar_integrations(id) on delete set null,
  add column if not exists external_event_id text,
  add column if not exists external_event_html_url text,
  add column if not exists external_sync_status text not null default 'not_configured' check (external_sync_status in ('not_configured','pending','synced','failed','cancelled')),
  add column if not exists external_sync_error text,
  add column if not exists conference_provider text,
  add column if not exists conference_request_id text;

create unique index appointments_external_event_unique_idx on public.appointments(calendar_integration_id, external_event_id) where external_event_id is not null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('patient','staff')),
  case_id uuid references public.patient_cases(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  event_type text not null check (event_type in ('consultation_scheduled','consultation_cancelled','consultation_reminder_24h','consultation_reminder_2h','treatment_plan_sent','treatment_plan_response','travel_update','records_received')),
  title text not null,
  body text not null,
  scheduled_for timestamptz not null default now(),
  delivery_status text not null default 'queued' check (delivery_status in ('queued','sent','failed','skipped')),
  delivered_at timestamptz,
  read_at timestamptz,
  dedupe_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications(recipient_user_id, created_at desc);
create index notifications_due_idx on public.notifications(delivery_status, scheduled_for) where delivery_status = 'queued';
create index notifications_appointment_idx on public.notifications(appointment_id, event_type);

alter table public.calendar_integrations enable row level security;
alter table public.calendar_integration_secrets enable row level security;
alter table public.google_oauth_states enable row level security;
alter table public.notifications enable row level security;

revoke all on public.calendar_integration_secrets from anon, authenticated;
revoke all on public.google_oauth_states from anon, authenticated;
grant all on public.calendar_integration_secrets to service_role;
grant all on public.google_oauth_states to service_role;

grant select on public.calendar_integrations to authenticated;
grant select, update on public.calendar_integrations to authenticated;
grant select, update on public.notifications to authenticated;
grant all on public.calendar_integrations to service_role;
grant all on public.notifications to service_role;

create policy "owner admin read calendar integrations" on public.calendar_integrations for select to authenticated using (private.has_staff_role(array['owner','admin']));
create policy "owner admin update calendar integrations" on public.calendar_integrations for update to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "recipient reads own notifications" on public.notifications for select to authenticated using (recipient_user_id = auth.uid());
create policy "recipient marks own notifications read" on public.notifications for update to authenticated using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

create or replace function private.enqueue_appointment_notification(
  p_recipient uuid,
  p_recipient_type text,
  p_case_id uuid,
  p_appointment_id uuid,
  p_event_type text,
  p_title text,
  p_body text,
  p_scheduled_for timestamptz,
  p_dedupe_key text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient is null then return; end if;
  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  values (p_recipient, p_recipient_type, p_case_id, p_appointment_id, p_event_type, p_title, p_body, p_scheduled_for, p_dedupe_key)
  on conflict (dedupe_key) do nothing;
end;
$$;
revoke all on function private.enqueue_appointment_notification(uuid,text,uuid,uuid,text,text,text,timestamptz,text) from public;

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
  end if;
  return new;
end;
$$;
revoke all on function private.appointment_notification_trigger() from public;
drop trigger if exists appointment_notification_events on public.appointments;
create trigger appointment_notification_events after insert or update of status on public.appointments for each row execute function private.appointment_notification_trigger();

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
  select a.patient_id, 'patient', a.case_id, a.id, 'consultation_reminder_24h', 'Consultation reminder · 24 hours', 'Your JV Dental video consultation is approximately 24 hours away. Open your secure portal for joining details.', now(), 'appointment:' || a.id::text || ':reminder24:patient'
  from public.appointments a where a.status = 'scheduled' and a.starts_at > now() + interval '23 hours' and a.starts_at <= now() + interval '25 hours'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count; inserted_count := inserted_count + row_count;

  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.patient_id, 'patient', a.case_id, a.id, 'consultation_reminder_2h', 'Consultation reminder · 2 hours', 'Your JV Dental video consultation is approximately 2 hours away. Open your secure portal for the joining link.', now(), 'appointment:' || a.id::text || ':reminder2:patient'
  from public.appointments a where a.status = 'scheduled' and a.starts_at > now() + interval '90 minutes' and a.starts_at <= now() + interval '150 minutes'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count; inserted_count := inserted_count + row_count;

  insert into public.notifications(recipient_user_id, recipient_type, case_id, appointment_id, event_type, title, body, scheduled_for, dedupe_key)
  select a.clinician_user_id, 'staff', a.case_id, a.id, 'consultation_reminder_2h', 'Consultation reminder · 2 hours', 'A JV Dental video consultation is approximately 2 hours away. Open the clinic portal for details.', now(), 'appointment:' || a.id::text || ':reminder2:staff:' || a.clinician_user_id::text
  from public.appointments a where a.status = 'scheduled' and a.clinician_user_id is not null and a.starts_at > now() + interval '90 minutes' and a.starts_at <= now() + interval '150 minutes'
  on conflict (dedupe_key) do nothing;
  get diagnostics row_count = row_count; inserted_count := inserted_count + row_count;

  return inserted_count;
end;
$$;
revoke all on function public.enqueue_due_consultation_reminders() from public, anon, authenticated;
grant execute on function public.enqueue_due_consultation_reminders() to service_role;

create trigger calendar_integrations_touch_updated_at before update on public.calendar_integrations for each row execute function public.touch_updated_at();
create trigger calendar_integration_secrets_touch_updated_at before update on public.calendar_integration_secrets for each row execute function public.touch_updated_at();
