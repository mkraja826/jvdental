create policy "service role manages calendar secrets" on public.calendar_integration_secrets
  for all to service_role using (true) with check (true);

create policy "service role manages google oauth states" on public.google_oauth_states
  for all to service_role using (true) with check (true);
