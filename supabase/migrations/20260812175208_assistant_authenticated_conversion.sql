alter table public.assistant_sessions
  add column if not exists converted_patient_id uuid references auth.users(id) on delete set null;

create index if not exists assistant_sessions_converted_patient_idx
  on public.assistant_sessions(converted_patient_id)
  where converted_patient_id is not null;
