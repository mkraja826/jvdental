create or replace view public.patient_upcoming_appointments
with (security_invoker = true)
as
select
  id,
  patient_id,
  case_id,
  appointment_type,
  starts_at,
  ends_at,
  status,
  meeting_url,
  conference_provider,
  external_sync_status,
  timezone
from public.appointments
where status = 'scheduled'
  and starts_at >= now();

grant select on public.patient_upcoming_appointments to authenticated;
