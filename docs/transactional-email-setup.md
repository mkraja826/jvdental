# JV Dental transactional email setup

JV Dental keeps transactional email as a privacy-minimised notification channel. Protected clinical content remains inside the authenticated portal.

## Current architecture

1. Existing workflow triggers create a row in `public.notifications`.
2. `private.queue_notification_email()` creates one idempotent `public.email_deliveries` row for approved event types.
3. `dispatch-notification-emails` resolves the recipient email from Supabase Auth server-side.
4. The first provider adapter sends through Resend.
5. The email contains only a generic event summary and a secure portal link. It does not contain diagnoses, radiographs, CBCT content, clinical notes, treatment-plan line items, or secure-message text.

The dispatcher accepts no caller-supplied recipient, subject or message body. It only wakes the existing server-generated queue.

## Resend production configuration

1. Create or use the JV Dental Resend account.
2. Add and verify a sending domain controlled by JV Dental.
3. Configure SPF/DKIM records exactly as shown by Resend and wait for domain verification.
4. Create a production API key with the minimum required sending access.
5. Add these as Supabase Edge Function secrets:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<production key>
EMAIL_FROM=JV Dental <care@jvdental.com>
EMAIL_REPLY_TO=<optional monitored address>
SITE_URL=https://jvdental.com
```

`care@jvdental.com` above is an example sender only. Use an address on the actually verified sending domain.

Never use `NEXT_PUBLIC_` for any email-provider secret.

## Enable automatic queue delivery only after provider configuration

The dispatcher is deployed and ACTIVE, but automatic database scheduling is intentionally not enabled until the sender domain and provider secrets are verified. This avoids repeated provider-not-configured errors in production logs.

Supabase supports scheduled Edge Function invocation using `pg_cron` together with the `pg_net` extension. Once credentials are present and a manual dispatcher invocation is successful:

1. Enable the `pg_net` extension in the JV Dental Supabase project.
2. Store any scheduler authorization material using the approved Supabase secret-management approach rather than plain SQL.
3. Schedule a POST to the `dispatch-notification-emails` Edge Function every 2–5 minutes.
4. Use an empty JSON body. The dispatcher never accepts arbitrary message content.
5. Monitor `email_deliveries` for `retry`, `failed`, and `suppressed` states.

Do not enable the cron until the provider acceptance test below passes.

## Acceptance test

Use test patient/staff accounts only.

1. Generate a safe event such as a secure-message notification.
2. Confirm exactly one `email_deliveries` row is queued for its notification ID.
3. Invoke `dispatch-notification-emails` once.
4. Verify the recipient gets one email.
5. Confirm the email contains only generic JV Dental wording and a secure portal link.
6. Confirm no diagnosis, scan, estimate line item, medical history, or secure-message body appears in the email.
7. Invoke the dispatcher again and confirm the same delivery is not resent.
8. Test a temporary provider failure and verify retry/backoff.
9. Test a user without an email and confirm the delivery becomes `suppressed` rather than repeatedly retrying.
10. Only then enable the recurring scheduler.

## Operational rules

- Portal notifications remain the source of workflow context even if email delivery fails.
- A successful email is not evidence that a clinical/payment operation itself succeeded; the underlying JV Dental database record remains authoritative.
- Keep provider event/message IDs for diagnostics, not medical information.
- Rotate the API key if exposure is suspected and review failed delivery logs.
