# JV Dental transactional email setup

JV Dental keeps transactional email as a privacy-minimised notification channel. Protected clinical content remains inside the authenticated portal.

## Current architecture

1. Existing workflow triggers create a row in `public.notifications`.
2. `private.queue_notification_email()` creates one idempotent `public.email_deliveries` row for approved event types.
3. `dispatch-notification-emails` resolves the recipient email from Supabase Auth server-side.
4. The first provider adapter sends through Resend.
5. The email contains only a generic event summary and a secure portal link. It does not contain diagnoses, radiographs, CBCT content, clinical notes, treatment-plan line items, or secure-message text.

The dispatcher accepts no caller-supplied recipient, subject or message body. It only wakes the existing server-generated queue. It also requires the private `X-JV-Dispatch-Key` header to match `EMAIL_DISPATCH_SECRET`, so an unauthenticated internet caller cannot wake the queue after email delivery is enabled.

## Resend production configuration

1. Create or use the JV Dental Resend account.
2. Add and verify a sending domain controlled by JV Dental.
3. Configure SPF/DKIM records exactly as shown by Resend and wait for domain verification.
4. Create a production API key with the minimum required sending access.
5. Generate a long random dispatcher secret independently of the provider API key.
6. Add these as Supabase Edge Function secrets:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<production key>
EMAIL_FROM=JV Dental <care@jvdental.com>
EMAIL_REPLY_TO=<optional monitored address>
EMAIL_DISPATCH_SECRET=<long random scheduler secret>
SITE_URL=https://jvdental.com
```

`care@jvdental.com` above is an example sender only. Use an address on the actually verified sending domain.

Never use `NEXT_PUBLIC_` for any email-provider or dispatcher secret.

## Enable automatic queue delivery only after provider configuration

The dispatcher is deployed and ACTIVE, but automatic database scheduling is intentionally not enabled until the sender domain and provider secrets are verified. This avoids repeated provider-not-configured errors in production logs.

Supabase supports scheduled Edge Function invocation using `pg_cron` together with the `pg_net` extension. Once credentials are present and a manual dispatcher invocation is successful:

1. Enable the `pg_net` extension in the JV Dental Supabase project.
2. Store `EMAIL_DISPATCH_SECRET` using the approved Supabase secret-management approach rather than plain SQL.
3. Schedule a POST to the `dispatch-notification-emails` Edge Function every 2–5 minutes.
4. Use an empty JSON body.
5. Include `X-JV-Dispatch-Key: <EMAIL_DISPATCH_SECRET>` in the scheduled request.
6. Monitor `email_deliveries` for `retry`, `failed`, and `suppressed` states.

Do not enable the cron until the provider acceptance test below passes.

## Acceptance test

Use test patient/staff accounts only.

1. Generate a safe event such as a secure-message notification.
2. Confirm exactly one `email_deliveries` row is queued for its notification ID.
3. Invoke `dispatch-notification-emails` without the dispatcher header and confirm it is rejected.
4. Invoke it with the correct dispatcher secret.
5. Verify the recipient gets one email.
6. Confirm the email contains only generic JV Dental wording and a secure portal link.
7. Confirm no diagnosis, scan, estimate line item, medical history, or secure-message body appears in the email.
8. Invoke the dispatcher again and confirm the same delivery is not resent.
9. Test a temporary provider failure and verify retry/backoff.
10. Test a user without an email and confirm the delivery becomes `suppressed` rather than repeatedly retrying.
11. Only then enable the recurring scheduler.

## Operational rules

- Portal notifications remain the source of workflow context even if email delivery fails.
- A successful email is not evidence that a clinical/payment operation itself succeeded; the underlying JV Dental database record remains authoritative.
- Keep provider event/message IDs for diagnostics, not medical information.
- Rotate both the provider API key and dispatcher secret if exposure is suspected and review failed delivery logs.
