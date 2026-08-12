drop policy if exists "published doctor profiles are public" on public.doctor_profiles;
create policy "public reads published doctor profiles" on public.doctor_profiles for select to anon, authenticated using (status = 'published');
create policy "staff reads all doctor profiles" on public.doctor_profiles for select to authenticated using (private.is_active_staff());

drop policy if exists "published doctor qualifications are public" on public.doctor_qualifications;
create policy "public reads published doctor qualifications" on public.doctor_qualifications for select to anon, authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id = doctor_qualifications.doctor_profile_id and dp.status = 'published'));
create policy "staff reads all doctor qualifications" on public.doctor_qualifications for select to authenticated using (private.is_active_staff());

drop policy if exists "published doctor memberships are public" on public.doctor_memberships;
create policy "public reads published doctor memberships" on public.doctor_memberships for select to anon, authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id = doctor_memberships.doctor_profile_id and dp.status = 'published'));
create policy "staff reads all doctor memberships" on public.doctor_memberships for select to authenticated using (private.is_active_staff());

drop policy if exists "published doctor external links are public" on public.doctor_external_links;
create policy "public reads published doctor external links" on public.doctor_external_links for select to anon, authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id = doctor_external_links.doctor_profile_id and dp.status = 'published'));
create policy "staff reads all doctor external links" on public.doctor_external_links for select to authenticated using (private.is_active_staff());
