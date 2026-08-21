alter table public.appointment_requests
  add column if not exists assigned_clinician uuid references public.staff_profiles(user_id) on delete set null,
  add column if not exists confirmed_starts_at timestamptz,
  add column if not exists confirmed_ends_at timestamptz,
  add column if not exists staff_notes text,
  add column if not exists managed_by uuid references public.staff_profiles(user_id) on delete set null,
  add column if not exists confirmed_at timestamptz;

create index if not exists appointment_requests_status_created_idx
  on public.appointment_requests(status, created_at desc);
create index if not exists appointment_requests_assigned_clinician_idx
  on public.appointment_requests(assigned_clinician, confirmed_starts_at);

create trigger appointment_requests_touch_updated_at
before update on public.appointment_requests
for each row execute function public.touch_updated_at();
