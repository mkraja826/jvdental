create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  booking_kind text not null check (booking_kind in ('clinic_consultation','video_consultation')),
  full_name text not null,
  phone text not null,
  email text,
  city text,
  preferred_date date not null,
  preferred_time_window text not null check (preferred_time_window in ('morning','afternoon','evening')),
  dental_concern text,
  status text not null default 'requested' check (status in ('requested','payment_pending','paid','confirmed','completed','cancelled')),
  converted_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  appointment_request_id uuid not null references public.appointment_requests(id) on delete cascade,
  provider text not null check (provider in ('razorpay','stripe')),
  provider_order_id text,
  provider_payment_id text,
  amount_subunits integer not null check (amount_subunits > 0),
  currency char(3) not null default 'INR',
  status text not null default 'created' check (status in ('created','attempted','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists booking_payments_provider_order_idx on public.booking_payments(provider, provider_order_id) where provider_order_id is not null;
create index if not exists appointment_requests_status_date_idx on public.appointment_requests(status, preferred_date);

alter table public.appointment_requests enable row level security;
alter table public.booking_payments enable row level security;

revoke all on public.appointment_requests from anon;
revoke all on public.booking_payments from anon;
grant select, update on public.appointment_requests to authenticated;
grant select on public.booking_payments to authenticated;
grant all on public.appointment_requests to service_role;
grant all on public.booking_payments to service_role;

create policy "staff read appointment requests" on public.appointment_requests for select to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor','coordinator','receptionist','dental_assistant']));
create policy "staff update appointment requests" on public.appointment_requests for update to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor','coordinator','receptionist','dental_assistant'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor','coordinator','receptionist','dental_assistant']));
create policy "staff read booking payments" on public.booking_payments for select to authenticated using (private.has_staff_role(array['owner','admin','coordinator','receptionist']));

create trigger appointment_requests_touch_updated_at before update on public.appointment_requests for each row execute function public.touch_updated_at();
create trigger booking_payments_touch_updated_at before update on public.booking_payments for each row execute function public.touch_updated_at();
