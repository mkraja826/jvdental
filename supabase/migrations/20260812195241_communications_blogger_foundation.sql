create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  recipient_user_id uuid not null,
  recipient_type text not null check (recipient_type in ('patient','staff')),
  event_type text not null,
  status text not null default 'queued' check (status in ('queued','processing','retry','sent','failed','suppressed')),
  scheduled_for timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  provider text,
  provider_message_id text,
  last_error text,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists email_deliveries_due_idx on public.email_deliveries(status,next_attempt_at,scheduled_for);
create index if not exists email_deliveries_recipient_idx on public.email_deliveries(recipient_user_id,created_at desc);
alter table public.email_deliveries enable row level security;
drop policy if exists email_deliveries_admin_read on public.email_deliveries;
create policy email_deliveries_admin_read on public.email_deliveries for select to authenticated using (private.has_staff_role(array['owner','admin']::text[]));

create table if not exists public.publishing_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('blogger','wordpress','other')),
  connected_by uuid,
  account_email text,
  external_blog_id text,
  external_blog_name text,
  external_blog_url text,
  scopes text[] not null default '{}',
  status text not null default 'connected' check (status in ('connected','disconnected','error')),
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists publishing_integrations_one_connected_provider on public.publishing_integrations(provider) where status='connected';
alter table public.publishing_integrations enable row level security;
drop policy if exists publishing_integrations_clinical_read on public.publishing_integrations;
create policy publishing_integrations_clinical_read on public.publishing_integrations for select to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']::text[]));

create table if not exists public.publishing_integration_secrets (
  integration_id uuid primary key references public.publishing_integrations(id) on delete cascade,
  refresh_token_ciphertext text not null,
  refresh_token_iv text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.publishing_integration_secrets enable row level security;
drop policy if exists publishing_integration_secrets_service_role on public.publishing_integration_secrets;
create policy publishing_integration_secrets_service_role on public.publishing_integration_secrets for all to service_role using (true) with check (true);

create table if not exists public.blogger_oauth_states (
  state_hash text primary key,
  requested_by uuid not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.blogger_oauth_states enable row level security;
drop policy if exists blogger_oauth_states_service_role on public.blogger_oauth_states;
create policy blogger_oauth_states_service_role on public.blogger_oauth_states for all to service_role using (true) with check (true);

alter table public.blog_publications add column if not exists integration_id uuid references public.publishing_integrations(id) on delete set null;
alter table public.blog_publications add column if not exists external_blog_id text;
alter table public.blog_publications add column if not exists last_synced_at timestamptz;
create index if not exists blog_publications_integration_idx on public.blog_publications(integration_id,updated_at desc);

create or replace function private.queue_notification_email()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.event_type = any(array[
    'consultation_scheduled','consultation_rescheduled','consultation_cancelled',
    'consultation_reminder_24h','consultation_reminder_2h',
    'new_staff_message','new_patient_message','new_patient_document',
    'treatment_plan_sent','treatment_plan_response','travel_update',
    'payment_request','payment_received','payment_refund',
    'inventory_low_stock','inventory_expiry_30d'
  ]::text[]) then
    insert into public.email_deliveries(
      notification_id, recipient_user_id, recipient_type, event_type,
      scheduled_for, next_attempt_at
    ) values (
      new.id, new.recipient_user_id, new.recipient_type, new.event_type,
      greatest(new.scheduled_for, now()), greatest(new.scheduled_for, now())
    ) on conflict (notification_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.queue_notification_email() from public, anon, authenticated;
drop trigger if exists notifications_queue_email on public.notifications;
create trigger notifications_queue_email after insert on public.notifications for each row execute function private.queue_notification_email();

create or replace function public.notify_payment_request_changes()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='UPDATE' and old.status is distinct from new.status and new.status='sent' then
    insert into public.notifications(
      recipient_user_id, recipient_type, case_id, event_type, title, body, scheduled_for, dedupe_key
    ) values (
      new.patient_id, 'patient', new.case_id, 'payment_request', 'Payment request ready',
      'A JV Dental payment request is available in your secure portal.', now(),
      'payment-request-sent:'||new.id::text
    ) on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_payment_request_changes() from public, anon, authenticated;

create or replace function public.notify_payment_ledger_changes()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_table_name='payments' and new.status='succeeded' and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.notifications(
      recipient_user_id, recipient_type, case_id, event_type, title, body, scheduled_for, dedupe_key
    ) values (
      new.patient_id, 'patient', new.case_id, 'payment_received', 'Payment received',
      'Your payment was received and recorded securely. Open your JV Dental portal for the updated balance and receipt.', now(),
      'payment-received:'||new.id::text
    ) on conflict (dedupe_key) do nothing;
  elsif tg_table_name='payment_refunds' and new.status='succeeded' and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.notifications(
      recipient_user_id, recipient_type, case_id, event_type, title, body, scheduled_for, dedupe_key
    )
    select p.patient_id, 'patient', p.case_id, 'payment_refund', 'Refund processed',
      'A refund was processed for one of your JV Dental payments. Open your secure portal for the updated payment history.', now(),
      'payment-refund:'||new.id::text
    from public.payments p where p.id=new.payment_id
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.notify_payment_ledger_changes() from public, anon, authenticated;

grant select on public.email_deliveries to authenticated;
grant select on public.publishing_integrations to authenticated;
grant select,insert,update on public.email_deliveries to service_role;
grant select,insert,update,delete on public.publishing_integrations to service_role;
grant select,insert,update,delete on public.publishing_integration_secrets to service_role;
grant select,insert,update,delete on public.blogger_oauth_states to service_role;