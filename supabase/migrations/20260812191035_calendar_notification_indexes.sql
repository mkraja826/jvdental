create index if not exists calendar_integrations_connected_by_idx on public.calendar_integrations(connected_by);
create index if not exists google_oauth_states_requested_by_idx on public.google_oauth_states(requested_by);
create index if not exists notifications_case_id_idx on public.notifications(case_id);
