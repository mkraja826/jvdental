-- Provider-neutral finance ledger with Stripe as the first payment gateway.

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid not null references public.patient_cases(id) on delete restrict, treatment_plan_id uuid references public.treatment_plans(id) on delete set null,
  request_number bigint generated always as identity unique,
  request_type text not null default 'deposit' check (request_type in ('deposit','treatment_balance','installment','custom')),
  title text not null default 'JV Dental treatment payment', description text,
  amount_minor bigint not null check (amount_minor > 0), currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','sent','partially_paid','paid','cancelled','expired')),
  provider_preference text not null default 'stripe', due_at timestamptz, expires_at timestamptz,
  created_by uuid not null references public.staff_profiles(user_id) on delete restrict, sent_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index payment_requests_patient_idx on public.payment_requests(patient_id,created_at desc);
create index payment_requests_case_idx on public.payment_requests(case_id,created_at desc);
create index payment_requests_status_idx on public.payment_requests(status,created_at desc);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(), payment_request_id uuid not null references public.payment_requests(id) on delete restrict,
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict, provider text not null,
  amount_minor bigint not null check (amount_minor > 0), currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'created' check (status in ('created','redirected','completed','failed','expired','cancelled')),
  provider_session_id text unique, provider_payment_intent_id text, checkout_url text, billing_country text,
  failure_code text, failure_message text, initiated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index payment_attempts_request_idx on public.payment_attempts(payment_request_id,created_at desc);
create index payment_attempts_patient_idx on public.payment_attempts(patient_id,created_at desc);
create index payment_attempts_intent_idx on public.payment_attempts(provider_payment_intent_id) where provider_payment_intent_id is not null;

create table public.payments (
  id uuid primary key default gen_random_uuid(), payment_request_id uuid not null references public.payment_requests(id) on delete restrict,
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict, case_id uuid not null references public.patient_cases(id) on delete restrict,
  provider text not null, provider_payment_id text, provider_charge_id text,
  amount_minor bigint not null check (amount_minor > 0), currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending' check (status in ('pending','succeeded','failed','partially_refunded','refunded')),
  payment_method_summary text, paid_at timestamptz, receipt_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(provider,provider_payment_id), unique(provider,provider_charge_id)
);
create index payments_request_idx on public.payments(payment_request_id,created_at desc);
create index payments_patient_idx on public.payments(patient_id,created_at desc);
create index payments_case_idx on public.payments(case_id,created_at desc);

create table public.payment_refunds (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
  provider text not null, provider_refund_id text, amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'), status text not null default 'pending' check (status in ('pending','succeeded','failed','cancelled')),
  reason text, initiated_by uuid references public.staff_profiles(user_id) on delete restrict, processed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider,provider_refund_id)
);
create index payment_refunds_payment_idx on public.payment_refunds(payment_id,created_at desc);

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null unique references public.payments(id) on delete restrict,
  receipt_number bigint generated always as identity unique, issued_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table public.payment_provider_events (
  provider text not null, event_id text not null, event_type text not null, payload_hash text, processed_at timestamptz not null default now(), primary key(provider,event_id)
);

create trigger payment_requests_touch_updated_at before update on public.payment_requests for each row execute function public.touch_updated_at();
create trigger payment_attempts_touch_updated_at before update on public.payment_attempts for each row execute function public.touch_updated_at();
create trigger payments_touch_updated_at before update on public.payments for each row execute function public.touch_updated_at();
create trigger payment_refunds_touch_updated_at before update on public.payment_refunds for each row execute function public.touch_updated_at();

create or replace function private.guard_payment_request_financial_identity() returns trigger language plpgsql set search_path=public,private as $$
begin
  if exists(select 1 from public.payments p where p.payment_request_id=old.id and p.status in ('succeeded','partially_refunded','refunded')) then
    if new.patient_id is distinct from old.patient_id or new.case_id is distinct from old.case_id or new.treatment_plan_id is distinct from old.treatment_plan_id or new.amount_minor is distinct from old.amount_minor or new.currency is distinct from old.currency then raise exception 'Paid payment requests cannot change financial identity'; end if;
  end if;
  return new;
end; $$;
create trigger payment_requests_guard_financial_identity before update on public.payment_requests for each row execute function private.guard_payment_request_financial_identity();

create or replace function private.refresh_payment_request_status(p_request_id uuid) returns void language plpgsql security definer set search_path=public,private as $$
declare v_requested bigint; v_paid bigint; v_refunded bigint; v_current text;
begin
  select amount_minor,status into v_requested,v_current from public.payment_requests where id=p_request_id for update; if not found then return; end if;
  select coalesce(sum(amount_minor),0) into v_paid from public.payments where payment_request_id=p_request_id and status in ('succeeded','partially_refunded','refunded');
  select coalesce(sum(r.amount_minor),0) into v_refunded from public.payment_refunds r join public.payments p on p.id=r.payment_id where p.payment_request_id=p_request_id and r.status='succeeded';
  if v_paid-v_refunded>=v_requested then update public.payment_requests set status='paid' where id=p_request_id;
  elsif v_paid-v_refunded>0 then update public.payment_requests set status='partially_paid' where id=p_request_id;
  elsif v_current not in ('cancelled','expired','draft') then update public.payment_requests set status='sent' where id=p_request_id; end if;
end; $$;
revoke all on function private.refresh_payment_request_status(uuid) from public;

create or replace function private.payment_ledger_refresh_trigger() returns trigger language plpgsql security definer set search_path=public,private as $$
declare v_request uuid;
begin
  if tg_table_name='payments' then v_request:=coalesce(new.payment_request_id,old.payment_request_id); else select payment_request_id into v_request from public.payments where id=coalesce(new.payment_id,old.payment_id); end if;
  perform private.refresh_payment_request_status(v_request); return coalesce(new,old);
end; $$;
create trigger payments_refresh_request after insert or update of status,amount_minor on public.payments for each row execute function private.payment_ledger_refresh_trigger();
create trigger refunds_refresh_request after insert or update of status,amount_minor on public.payment_refunds for each row execute function private.payment_ledger_refresh_trigger();

create or replace view public.payment_request_balances with (security_invoker=true) as
select pr.id payment_request_id,pr.patient_id,pr.case_id,pr.amount_minor requested_minor,pr.currency,
coalesce((select sum(p.amount_minor) from public.payments p where p.payment_request_id=pr.id and p.status in ('succeeded','partially_refunded','refunded')),0)::bigint gross_paid_minor,
coalesce((select sum(r.amount_minor) from public.payment_refunds r join public.payments p on p.id=r.payment_id where p.payment_request_id=pr.id and r.status='succeeded'),0)::bigint refunded_minor,
greatest(pr.amount_minor-(coalesce((select sum(p.amount_minor) from public.payments p where p.payment_request_id=pr.id and p.status in ('succeeded','partially_refunded','refunded')),0)-coalesce((select sum(r.amount_minor) from public.payment_refunds r join public.payments p on p.id=r.payment_id where p.payment_request_id=pr.id and r.status='succeeded'),0)),0)::bigint remaining_minor
from public.payment_requests pr;
grant select on public.payment_request_balances to authenticated;

alter table public.payment_requests enable row level security; alter table public.payment_attempts enable row level security; alter table public.payments enable row level security; alter table public.payment_refunds enable row level security; alter table public.payment_receipts enable row level security; alter table public.payment_provider_events enable row level security;
create policy "patient reads own payment requests" on public.payment_requests for select to authenticated using(patient_id=(select auth.uid()));
create policy "staff reads payment requests" on public.payment_requests for select to authenticated using(private.is_active_staff());
create policy "finance staff creates payment requests" on public.payment_requests for insert to authenticated with check(private.has_staff_role(array['owner','admin','coordinator','receptionist']) and created_by=(select auth.uid()));
create policy "finance staff updates payment requests" on public.payment_requests for update to authenticated using(private.has_staff_role(array['owner','admin','coordinator','receptionist'])) with check(private.has_staff_role(array['owner','admin','coordinator','receptionist']));
create policy "patient reads own payment attempts" on public.payment_attempts for select to authenticated using(patient_id=(select auth.uid())); create policy "staff reads payment attempts" on public.payment_attempts for select to authenticated using(private.is_active_staff());
create policy "patient reads own payments" on public.payments for select to authenticated using(patient_id=(select auth.uid())); create policy "staff reads payments" on public.payments for select to authenticated using(private.is_active_staff());
create policy "patient reads own refunds" on public.payment_refunds for select to authenticated using(exists(select 1 from public.payments p where p.id=payment_refunds.payment_id and p.patient_id=(select auth.uid()))); create policy "staff reads refunds" on public.payment_refunds for select to authenticated using(private.is_active_staff());
create policy "patient reads own receipts" on public.payment_receipts for select to authenticated using(exists(select 1 from public.payments p where p.id=payment_receipts.payment_id and p.patient_id=(select auth.uid()))); create policy "staff reads receipts" on public.payment_receipts for select to authenticated using(private.is_active_staff());
create policy "service role owns provider events" on public.payment_provider_events for all to service_role using(true) with check(true);

create or replace function public.notify_payment_request_changes() returns trigger language plpgsql security definer set search_path=public,private as $$
begin if tg_op='UPDATE' and old.status is distinct from new.status and new.status='sent' then insert into public.notifications(recipient_user_id,case_id,kind,title,body,href,dedupe_key) values(new.patient_id,new.case_id,'payment_request','Payment request ready','A JV Dental payment request is available in your secure portal.','/patient/payments','payment-request-sent:'||new.id::text) on conflict(dedupe_key) do nothing; end if; return new; end; $$;
create trigger payment_request_notification after update of status on public.payment_requests for each row execute function public.notify_payment_request_changes();

create or replace function public.notify_payment_ledger_changes() returns trigger language plpgsql security definer set search_path=public,private as $$
begin
  if tg_table_name='payments' and tg_op='UPDATE' and old.status is distinct from new.status and new.status='succeeded' then insert into public.notifications(recipient_user_id,case_id,kind,title,body,href,dedupe_key) values(new.patient_id,new.case_id,'payment_received','Payment received','Your payment was received and recorded securely.','/patient/payments','payment-received:'||new.id::text) on conflict(dedupe_key) do nothing;
  elsif tg_table_name='payment_refunds' and tg_op='UPDATE' and old.status is distinct from new.status and new.status='succeeded' then insert into public.notifications(recipient_user_id,case_id,kind,title,body,href,dedupe_key) select p.patient_id,p.case_id,'payment_refund','Refund processed','A refund was processed for one of your JV Dental payments.','/patient/payments','payment-refund:'||new.id::text from public.payments p where p.id=new.payment_id on conflict(dedupe_key) do nothing; end if; return new;
end; $$;
create trigger payment_received_notification after update of status on public.payments for each row execute function public.notify_payment_ledger_changes();
create trigger payment_refund_notification after update of status on public.payment_refunds for each row execute function public.notify_payment_ledger_changes();
