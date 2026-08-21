create or replace function public.clinic_dashboard_summary()
returns jsonb
language sql
stable
set search_path to 'public'
as $$
  select jsonb_build_object(
    'international_enquiries', (select count(*) from public.patient_cases),
    'awaiting_doctor_review', (select count(*) from public.patient_cases where status in ('records_received','doctor_review','more_information_required')),
    'scheduled_consultations', (select count(*) from public.appointments where status = 'scheduled' and starts_at > now()),
    'overdue_consultations', (select count(*) from public.appointments where status = 'scheduled' and starts_at <= now()),
    'requested_changes', (select count(*) from public.treatment_plans where status = 'requested_changes'),
    'travel_awaiting_confirmation', (select count(*) from public.travel_plans where status = 'details_submitted'),
    'unread_notifications', (select count(*) from public.notifications where recipient_type = 'staff' and read_at is null),
    'low_stock_items', public.dashboard_low_stock_count()
  );
$$;
