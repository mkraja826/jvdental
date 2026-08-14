alter table public.appointment_requests
  add column if not exists payment_access_token_hash text;

comment on column public.appointment_requests.payment_access_token_hash is
  'SHA-256 hash of the short-lived opaque browser token required to initiate public booking payment checkout.';
