create or replace function private.expire_payment_requests()
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_count integer;
begin
  update public.payment_requests
     set status = 'expired'
   where status in ('sent','partially_paid')
     and expires_at is not null
     and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.expire_payment_requests() from public, anon, authenticated;

select cron.schedule(
  'jv-expire-payment-requests',
  '*/5 * * * *',
  'select private.expire_payment_requests();'
);
