# JV Dental staff onboarding

## One-time first owner bootstrap

The JV Dental project intentionally has no public bootstrap-owner endpoint.

Before the staff console can be used, create the first owner through a trusted Supabase administrative path and verify that the owner can sign in at `/staff/login`. The staff profile must use role `owner` and `is_active = true`.

After the first owner is verified, all routine staff provisioning should happen from `/clinic/staff`.

## Staff roles

- `owner` — full clinic governance; can grant owner/admin access.
- `admin` — operational governance; cannot manage owner/admin roles.
- `implantologist` — clinical implant workflows.
- `doctor` — clinical workflows.
- `coordinator` — International Coordinator.
- `receptionist` — Reception.
- `dental_assistant` — Dental Assistant.

The database governance trigger prevents self-deactivation and prevents removal/demotion of the final active owner.

## Staff sign-in

Staff use `/staff/login` and receive a one-time magic link. `shouldCreateUser` is disabled on this screen, so an email address must already have been provisioned before staff login can succeed.

## Invitation emails

`invite-staff` is a JWT-protected Supabase Edge Function. It validates the caller's active JV Dental staff role and uses server-side admin credentials that are never exposed to the browser.

For hosted Supabase, update the **Invite user** email template to the SSR-safe content in `supabase/templates/invite.html` before enabling invitation emails in production. This template sends the token hash to `/auth/confirm`, which verifies it server-side and stores the session in cookies before redirecting to `/clinic`.

Until that hosted template is configured, provision staff with the invitation-email option unchecked and direct them to `/staff/login`.

## Access removal

Do not delete staff identities. Deactivate them from `/clinic/staff` so historical cases, notes, messages, implant records and audit events retain their author/clinician references.
