create table if not exists private.assistant_rate_events (
  id bigint generated always as identity primary key,
  rate_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists assistant_rate_events_key_created_idx
  on private.assistant_rate_events(rate_key, created_at desc);

grant usage on schema private to service_role;
grant select, insert, delete on table private.assistant_rate_events to service_role;
grant usage, select on sequence private.assistant_rate_events_id_seq to service_role;

create or replace function public.take_assistant_rate_limit(
  p_rate_key text,
  p_minute_limit integer default 12,
  p_hour_limit integer default 120
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  minute_count integer;
  hour_count integer;
begin
  if p_rate_key is null or length(p_rate_key) < 32 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_rate_key, 0));

  delete from private.assistant_rate_events
  where rate_key = p_rate_key
    and created_at < now() - interval '2 hours';

  select
    count(*) filter (where created_at >= now() - interval '1 minute'),
    count(*) filter (where created_at >= now() - interval '1 hour')
  into minute_count, hour_count
  from private.assistant_rate_events
  where rate_key = p_rate_key
    and created_at >= now() - interval '1 hour';

  if minute_count >= greatest(1, p_minute_limit)
     or hour_count >= greatest(1, p_hour_limit) then
    return false;
  end if;

  insert into private.assistant_rate_events(rate_key) values (p_rate_key);
  return true;
end;
$$;

revoke all on function public.take_assistant_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_assistant_rate_limit(text, integer, integer) to service_role;

select cron.schedule(
  'assistant-rate-event-cleanup',
  '17 * * * *',
  $$delete from private.assistant_rate_events where created_at < now() - interval '2 hours';$$
)
where not exists (select 1 from cron.job where jobname = 'assistant-rate-event-cleanup');
