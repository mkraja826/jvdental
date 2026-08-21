-- JV Dental publishing + signature cases + DIOnavi technology showcase

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.staff_profiles(user_id) on delete restrict,
  title text not null,
  slug text not null unique,
  excerpt text,
  content_markdown text not null default '',
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','review','scheduled','published','archived')),
  seo_title text,
  seo_description text,
  canonical_url text,
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_publications (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  channel text not null check (channel in ('jvdental','blogger','other')),
  external_blog_name text,
  external_post_id text,
  external_url text,
  publish_status text not null default 'pending' check (publish_status in ('pending','published','failed','removed')),
  last_error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blog_post_id, channel, external_blog_name)
);

create table public.signature_cases (
  id uuid primary key default gen_random_uuid(),
  internal_case_id uuid references public.patient_cases(id) on delete set null,
  created_by uuid not null references public.staff_profiles(user_id) on delete restrict,
  title text not null,
  slug text not null unique,
  case_code text,
  treatment_type text not null,
  short_summary text,
  diagnosis_summary text,
  challenge_summary text,
  treatment_plan_summary text,
  final_outcome_summary text,
  guided_implant boolean not null default false,
  dionavi_used boolean not null default false,
  full_arch boolean not null default false,
  featured boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in ('draft','review','published','archived')),
  patient_age_band text,
  patient_country text,
  consent_for_website boolean not null default false,
  consent_for_social boolean not null default false,
  anonymised boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signature_case_stages (
  id uuid primary key default gen_random_uuid(),
  signature_case_id uuid not null references public.signature_cases(id) on delete cascade,
  stage_type text not null check (stage_type in ('presentation','diagnosis','cbct','intraoral_scan','digital_planning','dionavi_planning','surgical_guide','implant_placement','temporary_prosthesis','prosthetic_phase','final_result','follow_up')),
  title text not null,
  body text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signature_case_media (
  id uuid primary key default gen_random_uuid(),
  signature_case_id uuid not null references public.signature_cases(id) on delete cascade,
  stage_id uuid references public.signature_case_stages(id) on delete set null,
  media_type text not null check (media_type in ('photo','xray','opg','cbct','planning_screenshot','surgical_guide','video','before','after','other')),
  storage_path text not null,
  alt_text text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.clinic_technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  brand text,
  category text,
  summary text,
  description text,
  website_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.clinic_technologies (name,slug,brand,category,summary,description,website_url,is_featured)
values ('DIOnavi Guided Implant Surgery','dionavi-guided-implant-surgery','DIO Implant','guided_implantology','Digital guided implant workflow using 3D imaging, virtual planning and a patient-specific surgical guide.','JV Dental uses DIOnavi-guided implant technology as part of selected implant cases. Public clinical claims and patient-specific suitability must be approved by the treating doctor before publication.','https://dionavi.com/',true)
on conflict (slug) do nothing;

create trigger blog_posts_touch_updated_at before update on public.blog_posts for each row execute function public.touch_updated_at();
create trigger blog_publications_touch_updated_at before update on public.blog_publications for each row execute function public.touch_updated_at();
create trigger signature_cases_touch_updated_at before update on public.signature_cases for each row execute function public.touch_updated_at();
create trigger signature_case_stages_touch_updated_at before update on public.signature_case_stages for each row execute function public.touch_updated_at();
create trigger clinic_technologies_touch_updated_at before update on public.clinic_technologies for each row execute function public.touch_updated_at();

alter table public.blog_posts enable row level security;
alter table public.blog_publications enable row level security;
alter table public.signature_cases enable row level security;
alter table public.signature_case_stages enable row level security;
alter table public.signature_case_media enable row level security;
alter table public.clinic_technologies enable row level security;

create policy "public reads published blogs" on public.blog_posts for select to anon, authenticated using ((status='published' and published_at is not null and published_at <= now()) or private.is_active_staff());
create policy "content staff manages blogs" on public.blog_posts for all to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']) and author_user_id=auth.uid());
create policy "staff reads blog publications" on public.blog_publications for select to authenticated using (private.is_active_staff());
create policy "content staff manages blog publications" on public.blog_publications for all to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "public reads published consented cases" on public.signature_cases for select to anon, authenticated using ((publication_status='published' and consent_for_website=true) or private.is_active_staff());
create policy "clinical staff manages signature cases" on public.signature_cases for all to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "public reads published case stages" on public.signature_case_stages for select to anon, authenticated using (exists (select 1 from public.signature_cases sc where sc.id=signature_case_stages.signature_case_id and sc.publication_status='published' and sc.consent_for_website=true) or private.is_active_staff());
create policy "clinical staff manages case stages" on public.signature_case_stages for all to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "public reads published case media metadata" on public.signature_case_media for select to anon, authenticated using (exists (select 1 from public.signature_cases sc where sc.id=signature_case_media.signature_case_id and sc.publication_status='published' and sc.consent_for_website=true) or private.is_active_staff());
create policy "clinical staff manages case media" on public.signature_case_media for all to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "public reads active technologies" on public.clinic_technologies for select to anon, authenticated using (is_active=true or private.is_active_staff());
create policy "owner admin manages technologies" on public.clinic_technologies for all to authenticated using (private.has_staff_role(array['owner','admin'])) with check (private.has_staff_role(array['owner','admin']));

insert into storage.buckets (id,name,public) values ('public-content','public-content',true) on conflict (id) do update set public=true;
create policy "public content read" on storage.objects for select to anon, authenticated using (bucket_id='public-content');
create policy "content staff upload public content" on storage.objects for insert to authenticated with check (bucket_id='public-content' and private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "content staff update public content" on storage.objects for update to authenticated using (bucket_id='public-content' and private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (bucket_id='public-content' and private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "content staff delete public content" on storage.objects for delete to authenticated using (bucket_id='public-content' and private.has_staff_role(array['owner','admin','implantologist','doctor']));
