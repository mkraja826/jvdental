alter table public.appointment_requests
  add column if not exists patient_id uuid references auth.users(id) on delete set null;

create index if not exists appointment_requests_patient_id_idx
  on public.appointment_requests(patient_id)
  where patient_id is not null;

create unique index if not exists appointment_requests_converted_appointment_uidx
  on public.appointment_requests(converted_appointment_id)
  where converted_appointment_id is not null;
