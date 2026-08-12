# JV Dental — Google Calendar + Meet setup

This integration is designed for clinic video-consultation logistics only. The Google Calendar event must remain generic. Patient diagnoses, radiographs, CBCT/DICOM records, clinical notes, estimates, treatment-plan details and travel details stay inside the protected JV Dental portal.

## What is already implemented

The platform includes JWT-protected Supabase Edge Functions for:

- starting Google OAuth (`google-calendar-oauth-start`)
- completing OAuth and storing an encrypted refresh token (`google-calendar-oauth-complete`)
- creating/updating/cancelling/refreshing consultation events (`google-calendar-event`)
- disconnecting and attempting Google token revocation (`google-calendar-disconnect`)

The clinic portal exposes the connection under `/clinic/integrations` for Owner/Admin users.

## Google Cloud setup

1. Create or select a Google Cloud project owned by the clinic/organization.
2. Enable the **Google Calendar API**.
3. Configure the Google Auth platform / OAuth consent screen with the clinic's verified application information and support contact.
4. Create an OAuth 2.0 **Web application** client.
5. Add the production authorized redirect URI exactly as:

   `https://jvdental.com/clinic/integrations/google-calendar/callback`

   Google requires the redirect URI used by the application to exactly match an authorized redirect URI, including scheme, host, path and trailing-slash behavior.
6. If a staging domain is used later, add its callback explicitly rather than reusing production credentials blindly.

The integration requests only the scopes needed for account identity and event management:

- `openid`
- `email`
- `https://www.googleapis.com/auth/calendar.events`

## Supabase Edge Function secrets

Configure these as Supabase Edge Function secrets. **Never commit their values to GitHub.**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `SITE_URL=https://jvdental.com`

Optional override:

- `GOOGLE_CALENDAR_REDIRECT_URI=https://jvdental.com/clinic/integrations/google-calendar/callback`

`GOOGLE_TOKEN_ENCRYPTION_KEY` should be a high-entropy random secret stored only in the deployment secret manager. It is used by the Edge Functions to encrypt/decrypt the Google refresh token before it is stored in the database.

## Connect the clinic calendar

1. Provision and verify the first real JV Dental Owner account.
2. Sign in through `/staff/login`.
3. Open `/clinic/integrations`.
4. Choose **Connect Google Calendar**.
5. Sign in with the clinic Google account that should own consultation events.
6. Review the consent screen and approve the Calendar events scope.
7. Confirm the integrations page reports the connected Google account and no sync error.

Only one connected Google Calendar integration is active at a time by design.

## Validation checklist

Use test patient/staff accounts only; never use production patient records for integration testing.

1. Schedule a future video consultation.
2. Confirm one Google Calendar event is created with the generic title **JV Dental video consultation**.
3. Confirm a unique Google Meet link appears in both the clinic appointment and patient portal.
4. Confirm attendee invitations/updates arrive for the test patient and clinician where valid emails exist.
5. Confirm the Calendar event contains no diagnosis, treatment details, notes, file names or other clinical data.
6. Reschedule the appointment and confirm the same external event is updated rather than duplicated.
7. Cancel the appointment and confirm the external event is cancelled/deleted.
8. Disconnect Google Calendar from `/clinic/integrations` and confirm future JV Dental appointments continue to work locally with the manual-link fallback.

## Failure behavior

Google Calendar is an integration, not the clinical source of truth. If Google OAuth, token refresh or Calendar API calls fail:

- the JV Dental appointment remains stored locally;
- the clinic UI records the external sync state/error;
- staff can retry Calendar/Meet sync;
- a manual meeting URL remains supported;
- no clinical record is lost or moved to Google.

## Notification behavior

Portal notifications are independent of Google Calendar and continue to work when Google is disconnected.

Automated in-app events include:

- consultation scheduled/cancelled
- consultation reminders
- new patient document
- secure patient/staff message
- treatment plan sent/accepted/change request
- travel updates
- inventory low-stock and approaching-expiry alerts

Google attendee emails are available only after Google Calendar is connected. A separate transactional-email provider has not yet been configured for non-calendar application notifications.
