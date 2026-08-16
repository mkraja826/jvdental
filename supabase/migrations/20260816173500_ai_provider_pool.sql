-- JV Dental public assistant: provider pool metadata and runtime health.
-- API keys remain in Supabase Edge Function secrets. This table stores only the
-- environment-variable name that contains each key.

create table if not exists public.ai_provider_pool (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  model_name text not null,
  endpoint text not null,
  api_key_env_name text not null,
  priority integer not null default 100,
  is_active boolean not null default true,
  status text not null default 'active' check (status in ('active','cooldown','quota_exhausted','unhealthy','disabled')),
  daily_request_limit integer,
  requests_today integer not null default 0,
  quota_day date not null default (now() at time zone 'utc')::date,
  consecutive_failures integer not null default 0,
  cooldown_until timestamptz,
  last_http_status integer,
  last_error text,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_name, model_name, endpoint, api_key_env_name)
);

create index if not exists ai_provider_pool_runtime_idx
  on public.ai_provider_pool (is_active, status, priority, cooldown_until);

alter table public.ai_provider_pool enable row level security;

-- Provider credentials/configuration are backend-only. The service role bypasses
-- RLS, while public/authenticated clients receive no direct table access.
revoke all on table public.ai_provider_pool from anon, authenticated;

create or replace function public.reset_ai_provider_daily_counters()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_provider_pool
  set requests_today = 0,
      quota_day = (now() at time zone 'utc')::date,
      status = case when status = 'quota_exhausted' then 'active' else status end,
      cooldown_until = case when status = 'quota_exhausted' then null else cooldown_until end,
      updated_at = now()
  where quota_day <> (now() at time zone 'utc')::date;
end;
$$;

revoke all on function public.reset_ai_provider_daily_counters() from public, anon, authenticated;
grant execute on function public.reset_ai_provider_daily_counters() to service_role;

comment on table public.ai_provider_pool is
  'Backend-only metadata for JV Dental AI fallback providers. API keys are stored as Edge Function secrets referenced by api_key_env_name.';
