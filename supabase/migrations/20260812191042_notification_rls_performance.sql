drop policy if exists "recipient reads own notifications" on public.notifications;
create policy "recipient reads own notifications" on public.notifications
  for select to authenticated
  using (recipient_user_id = (select auth.uid()));

drop policy if exists "recipient marks own notifications read" on public.notifications;
create policy "recipient marks own notifications read" on public.notifications
  for update to authenticated
  using (recipient_user_id = (select auth.uid()))
  with check (recipient_user_id = (select auth.uid()));
