alter table public.publishing_integrations drop constraint if exists publishing_integrations_status_check;
alter table public.publishing_integrations add constraint publishing_integrations_status_check check (status in ('connected','needs_selection','disconnected','error'));

create table if not exists public.publishing_integration_blogs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.publishing_integrations(id) on delete cascade,
  external_blog_id text not null,
  name text not null,
  url text,
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(integration_id, external_blog_id)
);
create unique index if not exists publishing_integration_one_selected_blog on public.publishing_integration_blogs(integration_id) where is_selected;
alter table public.publishing_integration_blogs enable row level security;
drop policy if exists publishing_integration_blogs_clinical_read on public.publishing_integration_blogs;
create policy publishing_integration_blogs_clinical_read on public.publishing_integration_blogs for select to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor']::text[]));
grant select on public.publishing_integration_blogs to authenticated;
grant select,insert,update,delete on public.publishing_integration_blogs to service_role;