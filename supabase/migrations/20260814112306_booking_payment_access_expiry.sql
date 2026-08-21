alter table public.appointment_requests
  add column if not exists payment_access_token_expires_at timestamptz;

comment on column public.appointment_requests.payment_access_token_expires_at is
  'Expiry for the opaque public booking checkout credential.';
