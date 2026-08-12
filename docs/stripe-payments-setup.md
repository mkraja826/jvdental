# JV Dental — Stripe payments production setup

Stripe is the first payment gateway in JV Dental, primarily intended for international-patient card payments. The application finance ledger remains provider-neutral so another gateway can be added later without rewriting treatment plans, payment history, receipts, or refunds.

## 1. India account prerequisites

Before enabling live Stripe payments, confirm that JV Dental has an approved Stripe account in India. New Stripe account access in India may require an invitation and international/export onboarding may require additional business information.

Do not enable the patient Stripe button against live mode until the account is approved for the intended international payment flow.

## 2. Supabase Edge Function secrets

Configure these only as Supabase Edge Function secrets. Never expose them as `NEXT_PUBLIC_*` values and never commit them to GitHub.

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SITE_URL=https://jvdental.com`

The patient browser never receives the Stripe secret key.

## 3. Stripe webhook endpoint

Create a Stripe webhook endpoint pointing to the deployed Supabase Edge Function:

`https://awajvlxdifnkhngbdron.supabase.co/functions/v1/stripe-webhook`

Subscribe to these events:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `refund.created`
- `refund.updated`
- `refund.failed`

Copy the webhook endpoint signing secret into the Supabase secret `STRIPE_WEBHOOK_SECRET`.

The webhook intentionally does not require a JV Dental JWT because Stripe calls it directly. It validates the Stripe `Stripe-Signature` HMAC and rejects signatures outside the timestamp tolerance before reconciling any finance record.

## 4. Data separation

JV Dental does not collect or store raw card numbers, CVCs, or card expiry dates. The patient is redirected to Stripe-hosted Checkout.

Do not put diagnoses, radiographs, treatment notes, medical conditions, or other clinical data into Stripe metadata. Current Stripe metadata contains only opaque JV Dental record identifiers needed for reconciliation.

## 5. Payment lifecycle

1. Clinic creates a draft payment request.
2. Staff explicitly sends it to the patient.
3. Patient opens `/patient/payments`.
4. Patient chooses Stripe Checkout.
5. JV Dental creates a local payment attempt.
6. Stripe-hosted Checkout collects payment details.
7. Browser returns to JV Dental, but the return URL does **not** mark the request paid.
8. Stripe webhook confirms the payment.
9. JV Dental records the payment, generates its internal receipt number, recalculates the remaining balance, and notifies the patient.
10. Refunds are owner/admin initiated and reconciled through Stripe refund events.

## 6. Acceptance test before live launch

Use Stripe test mode first.

Verify this full sequence:

- create a USD test deposit request;
- send it to a test patient;
- open Checkout from the patient portal;
- complete a successful test card payment;
- verify the browser return page alone does not create a payment;
- verify `payment_intent.succeeded` creates exactly one payment ledger row;
- resend the same webhook and verify idempotency;
- verify remaining balance becomes zero or the correct partial balance;
- verify JV receipt creation and Stripe receipt link;
- test a failed payment;
- test an expired Checkout Session;
- test a partial refund;
- test a second partial refund;
- verify refunds cannot exceed the remaining refundable amount;
- verify patient can only see their own payment records;
- verify coordinator/reception can create/send requests but cannot issue Stripe refunds;
- verify only owner/admin can issue refunds;
- verify no raw card data or clinical data is stored in JV Dental or Stripe metadata.

## 7. Domestic India payments

Do not assume Stripe will provide the desired domestic UPI/local-payment experience for an India-based account. If JV Dental later needs domestic UPI/card collection, add a separate Indian payment provider behind the existing provider-neutral finance ledger rather than changing treatment-plan or receipt architecture.
