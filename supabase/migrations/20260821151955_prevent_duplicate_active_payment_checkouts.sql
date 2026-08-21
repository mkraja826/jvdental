create unique index if not exists payment_attempts_one_active_checkout_idx
  on public.payment_attempts(payment_request_id, provider)
  where status in ('created','redirected');
