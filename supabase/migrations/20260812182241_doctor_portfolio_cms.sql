create table public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid unique references public.staff_profiles(user_id) on delete set null,
  full_name text not null,
  slug text not null unique,
  professional_title text,
  short_intro text,
  biography text,
  treatment_philosophy text,
  overall_experience_years integer check (overall_experience_years is null or overall_experience_years >= 0),
  specialist_experience_years integer check (specialist_experience_years is null or specialist_experience_years >= 0),
  registration_number text,
  registration_council text,
  languages text[] not null default '{}',
  specialties text[] not null default '{}',
  technologies text[] not null default '{}',
  profile_image_path text,
  hero_image_path text,
  practo_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctor_qualifications (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  qualification text not null,
  institution text,
  completion_year integer check (completion_year is null or completion_year between 1900 and 2200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.doctor_memberships (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  organisation text not null,
  membership_number text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.doctor_external_links (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references public.doctor_profiles(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.blog_posts add column if not exists doctor_profile_id uuid references public.doctor_profiles(id) on delete set null;
alter table public.signature_cases add column if not exists doctor_profile_id uuid references public.doctor_profiles(id) on delete set null;

create index doctor_profiles_status_order_idx on public.doctor_profiles(status, display_order, full_name);
create index doctor_qualifications_doctor_idx on public.doctor_qualifications(doctor_profile_id, sort_order);
create index doctor_memberships_doctor_idx on public.doctor_memberships(doctor_profile_id, sort_order);
create index doctor_external_links_doctor_idx on public.doctor_external_links(doctor_profile_id, sort_order);
create index blog_posts_doctor_profile_idx on public.blog_posts(doctor_profile_id);
create index signature_cases_doctor_profile_idx on public.signature_cases(doctor_profile_id);

create trigger doctor_profiles_touch_updated_at before update on public.doctor_profiles for each row execute function public.touch_updated_at();

alter table public.doctor_profiles enable row level security;
alter table public.doctor_qualifications enable row level security;
alter table public.doctor_memberships enable row level security;
alter table public.doctor_external_links enable row level security;

create policy "published doctor profiles are public" on public.doctor_profiles for select to anon, authenticated using (status = 'published' or private.is_active_staff());
create policy "owner admin manage doctor profiles" on public.doctor_profiles for all to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "doctor can update own profile" on public.doctor_profiles for update to authenticated using (staff_user_id = auth.uid() and private.is_active_staff()) with check (staff_user_id = auth.uid() and private.is_active_staff());

create policy "published doctor qualifications are public" on public.doctor_qualifications for select to anon, authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id = doctor_qualifications.doctor_profile_id and (dp.status = 'published' or private.is_active_staff())));
create policy "owner admin manage doctor qualifications" on public.doctor_qualifications for all to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "doctor manages own qualifications" on public.doctor_qualifications for all to authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id=doctor_qualifications.doctor_profile_id and dp.staff_user_id=auth.uid() and private.is_active_staff())) with check (exists (select 1 from public.doctor_profiles dp where dp.id=doctor_qualifications.doctor_profile_id and dp.staff_user_id=auth.uid() and private.is_active_staff()));

create policy "published doctor memberships are public" on public.doctor_memberships for select to anon, authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id = doctor_memberships.doctor_profile_id and (dp.status = 'published' or private.is_active_staff())));
create policy "owner admin manage doctor memberships" on public.doctor_memberships for all to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "doctor manages own memberships" on public.doctor_memberships for all to authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id=doctor_memberships.doctor_profile_id and dp.staff_user_id=auth.uid() and private.is_active_staff())) with check (exists (select 1 from public.doctor_profiles dp where dp.id=doctor_memberships.doctor_profile_id and dp.staff_user_id=auth.uid() and private.is_active_staff()));

create policy "published doctor external links are public" on public.doctor_external_links for select to anon, authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id = doctor_external_links.doctor_profile_id and (dp.status = 'published' or private.is_active_staff())));
create policy "owner admin manage doctor external links" on public.doctor_external_links for all to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));
create policy "doctor manages own external links" on public.doctor_external_links for all to authenticated using (exists (select 1 from public.doctor_profiles dp where dp.id=doctor_external_links.doctor_profile_id and dp.staff_user_id=auth.uid() and private.is_active_staff())) with check (exists (select 1 from public.doctor_profiles dp where dp.id=doctor_external_links.doctor_profile_id and dp.staff_user_id=auth.uid() and private.is_active_staff()));

insert into public.doctor_profiles (
  full_name, slug, professional_title, short_intro,
  overall_experience_years, specialist_experience_years,
  specialties, technologies, practo_url, status, featured, display_order, published_at
) values (
  'Dr. Jaya Prakash',
  'dr-jaya-prakash',
  'Implantologist · Digital Guided Implant Dentistry',
  'Implant-focused clinical care with digital guided planning and DIOnavi-guided implant workflows.',
  25,
  22,
  array['Dental Implants','Guided Implant Surgery','Full-Mouth Implant Rehabilitation'],
  array['DIOnavi Guided Implant Surgery'],
  'https://www.practo.com/Hyderabad/doctor/jaya-prakash-1-dentist',
  'published',
  true,
  1,
  now()
)
on conflict (slug) do update set
  professional_title = excluded.professional_title,
  short_intro = excluded.short_intro,
  overall_experience_years = excluded.overall_experience_years,
  specialist_experience_years = excluded.specialist_experience_years,
  specialties = excluded.specialties,
  technologies = excluded.technologies,
  practo_url = excluded.practo_url,
  status = 'published',
  featured = true,
  updated_at = now();
