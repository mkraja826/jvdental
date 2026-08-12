-- JV Dental consultation -> treatment plan/estimate -> patient response -> travel workflow

alter table public.appointments
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists notes text;

create index if not exists appointments_patient_starts_idx on public.appointments(patient_id, starts_at desc);
create index if not exists appointments_case_starts_idx on public.appointments(case_id, starts_at desc);
create index if not exists appointments_clinician_starts_idx on public.appointments(clinician_user_id, starts_at desc);

alter table public.treatment_plans
  add column if not exists title text,
  add column if not exists doctor_message text,
  add column if not exists valid_until date,
  add column if not exists sent_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists patient_responded_at timestamptz;

alter table public.treatment_plans drop constraint if exists treatment_plans_status_check;
alter table public.treatment_plans
  add constraint treatment_plans_status_check
  check (status in ('draft','preliminary','sent','requested_changes','accepted','superseded'));

create index if not exists treatment_plans_patient_created_idx on public.treatment_plans(patient_id, created_at desc);
create index if not exists treatment_plans_case_version_idx on public.treatment_plans(case_id, version desc);
create index if not exists treatment_plan_items_plan_idx on public.treatment_plan_items(treatment_plan_id, sort_order, id);

create table if not exists public.treatment_plan_feedback (
  id uuid primary key default gen_random_uuid(),
  treatment_plan_id uuid not null references public.treatment_plans(id) on delete cascade,
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  response text not null check (response in ('accepted','request_changes')),
  message text,
  created_at timestamptz not null default now(),
  unique (treatment_plan_id, patient_id)
);
create index if not exists treatment_plan_feedback_patient_idx on public.treatment_plan_feedback(patient_id, created_at desc);

alter table public.treatment_plan_feedback enable row level security;

create policy "patient reads own treatment plan feedback"
on public.treatment_plan_feedback for select to authenticated
using (patient_id = (select auth.uid()) or private.is_active_staff());

create policy "patient responds to sent own treatment plan"
on public.treatment_plan_feedback for insert to authenticated
with check (
  patient_id = (select auth.uid())
  and exists (
    select 1 from public.treatment_plans tp
    where tp.id = treatment_plan_id
      and tp.patient_id = (select auth.uid())
      and tp.status = 'sent'
  )
);

create policy "staff reads treatment plan feedback"
on public.treatment_plan_feedback for select to authenticated
using (private.is_active_staff());

create or replace function private.apply_treatment_plan_feedback()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.response = 'accepted' then
    update public.treatment_plans
       set status = 'accepted', accepted_at = now(), patient_responded_at = now(), updated_at = now()
     where id = new.treatment_plan_id and patient_id = new.patient_id and status = 'sent';
  elsif new.response = 'request_changes' then
    update public.treatment_plans
       set status = 'requested_changes', patient_responded_at = now(), updated_at = now()
     where id = new.treatment_plan_id and patient_id = new.patient_id and status = 'sent';
  end if;
  return new;
end;
$$;

revoke all on function private.apply_treatment_plan_feedback() from public;

drop trigger if exists treatment_plan_feedback_apply on public.treatment_plan_feedback;
create trigger treatment_plan_feedback_apply
after insert on public.treatment_plan_feedback
for each row execute function private.apply_treatment_plan_feedback();

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid not null references public.patient_cases(id) on delete cascade,
  status text not null default 'planning' check (status in ('planning','details_submitted','confirmed','completed','cancelled')),
  arrival_date date,
  departure_date date,
  arrival_flight text,
  departure_flight text,
  accommodation_name text,
  accommodation_address text,
  airport_pickup_required boolean not null default false,
  companion_name text,
  companion_phone text,
  patient_notes text,
  coordinator_notes text,
  confirmed_by uuid references public.staff_profiles(user_id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id)
);
create index if not exists travel_plans_patient_idx on public.travel_plans(patient_id, updated_at desc);
create index if not exists travel_plans_status_idx on public.travel_plans(status, arrival_date);

create trigger travel_plans_touch_updated_at
before update on public.travel_plans
for each row execute function public.touch_updated_at();

alter table public.travel_plans enable row level security;

create policy "patient reads own travel plan"
on public.travel_plans for select to authenticated
using (patient_id = (select auth.uid()) or private.is_active_staff());

create policy "patient creates own travel plan"
on public.travel_plans for insert to authenticated
with check (
  patient_id = (select auth.uid())
  and status in ('planning','details_submitted')
  and exists (select 1 from public.patient_cases pc where pc.id = case_id and pc.patient_id = (select auth.uid()))
);

create policy "patient updates own unconfirmed travel plan"
on public.travel_plans for update to authenticated
using (patient_id = (select auth.uid()) and status in ('planning','details_submitted'))
with check (
  patient_id = (select auth.uid())
  and status in ('planning','details_submitted')
  and confirmed_by is null
  and confirmed_at is null
  and exists (select 1 from public.patient_cases pc where pc.id = case_id and pc.patient_id = (select auth.uid()))
);

create policy "staff manages travel plans"
on public.travel_plans for all to authenticated
using (private.is_active_staff())
with check (private.is_active_staff());
