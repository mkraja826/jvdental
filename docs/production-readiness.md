# JV Dental production readiness

This document is the launch gate for the JV Dental patient and clinic platform. A feature being implemented does not mean it is approved for real patient data.

## Current state

- Supabase project: `jvdental` (`awajvlxdifnkhngbdron`), Mumbai / `ap-south-1`.
- Supabase organization plan at the time of this review: **Free**.
- Supabase security advisor: clean after the production RLS hardening pass.
- Supabase performance advisor: no WARN-level findings after FK indexing, auth init-plan optimization and policy consolidation. INFO-level unused-index observations are intentionally retained until real workload data exists.
- Private patient Storage: 50 MB per object with server-side MIME + extension restrictions.
- Public case media Storage: 25 MB per object, JPEG/PNG/WebP/MP4 only.
- Application dependency versions are pinned with a committed npm lockfile.
- CI uses `npm ci`, audits production dependencies at high severity, type-checks, lints, builds, and smoke-tests production security headers/routes.
- Public assistant has both per-session rate limiting and an atomic salted-network-fingerprint limit. Raw client IP addresses are not stored by JV Dental for this limiter.

## Blocker: production Supabase plan, backup and disaster recovery

Do not place real production patient records in the current Free-plan project until an approved availability/backup strategy is operational and a restore has been tested.

For a clinic production deployment, moving JV Dental to a paid Supabase plan with managed daily database backups is the preferred baseline. Free projects can be paused for low activity and do not provide the same managed-backup/availability posture expected for a patient-facing clinical system.

Database backups do not contain the underlying Storage objects, so a database backup alone is not sufficient for JV Dental because radiographs, CBCT archives and clinical media are stored in Supabase Storage.

### Minimum launch requirement

1. Upgrade the production Supabase project to the clinic-approved production plan before real patient onboarding, or document an equivalent availability/backup architecture approved by the clinic.
2. Confirm managed database backup settings or operate a separately secured, audited logical database backup process.
3. Maintain an encrypted off-site copy of both Storage buckets independently of database backups.
4. Keep backup credentials outside this public GitHub repository.
5. Define retention and deletion periods with the clinic's privacy/legal policy before production use.
6. Perform a restore drill to a non-production project using synthetic/test data.
7. Record the restore date, operator, recovery point, recovery duration and any missing assets.
8. Repeat restore drills after meaningful schema/storage changes and periodically during operations.

### Suggested operational targets for launch

- Database recovery point objective: no more than 24 hours initially; consider PITR later if the clinic requires a tighter target.
- Storage recovery point objective: no more than 24 hours.
- Restore test: before launch and after major infrastructure changes.
- Never use production patient data for restore testing in developer environments.

These are internal engineering targets, not legal/compliance guarantees.

## Blocker: Supabase platform security settings

Before production:

- enable and verify database SSL enforcement
- review database Network Restrictions and restrict direct database access to the operational paths that genuinely need it
- enable MFA on administrative Supabase/GitHub accounts and organization-level enforcement where practical
- review Supabase Auth rate limits for the expected clinic/public workload
- enable CAPTCHA/Turnstile protection for public Auth entry points before a public launch
- configure a JV Dental-controlled custom SMTP provider for Auth emails
- use an OTP/magic-link expiry no longer than the clinic's approved security window; Supabase recommends one hour or less
- disable email-provider click/link tracking for Auth links if the SMTP provider enables it by default

The application already separates the flows correctly: patient magic links may create patient users; staff sign-in explicitly uses `shouldCreateUser: false` and therefore cannot provision arbitrary staff accounts.

## Blocker: real-user acceptance

Before launch:

1. Bootstrap and verify the first real Owner account.
2. Provision one test account for each actual staff role the clinic will use.
3. Verify staff deactivation, last-owner protection and permission boundaries.
4. Use synthetic patients to test patient login, intake, upload, messaging, consultation, treatment plan, payment request, travel and implant passport.
5. Verify that no staff role can read or modify data outside its intended workflow.

## Blocker: external integrations

All acceptance tests must use test/sandbox identities until the final controlled production test.

### Google Calendar + Meet

- Configure OAuth credentials.
- Connect the clinic-owned Google account.
- Schedule → invite → Meet → reschedule same event → cancel.
- Verify generic calendar metadata only; no clinical details.

### Blogger

- Connect the approved publishing account.
- Publish one synthetic article.
- Edit it in JV Dental and confirm Sync Blogger updates the same external post.
- Disconnect and verify publishing stops safely.

### Transactional email

- Verify a JV Dental-controlled sending domain.
- Configure provider and dispatch secrets.
- Run privacy-content acceptance tests.
- Enable recurring email dispatcher only after manual success.

### Stripe

- Complete the required Stripe account/onboarding steps.
- Use test mode first.
- Test payment request → Checkout → signed webhook → receipt → partial refund → duplicate webhook handling.
- Never mark payment state from the browser return URL.

### Public AI assistant

- Configure the approved model/provider only after model selection.
- Verify prompt-injection resistance and clinic-knowledge boundaries.
- Keep diagnosis, radiograph interpretation and prescribing blocked.
- [x] Server-side session rate limiting.
- [x] Atomic salted-network-fingerprint rate limiting without retaining raw IP addresses.
- Add CDN/WAF rules at the final public hosting layer as an additional perimeter control.

## Application boundary checklist

- [x] HSTS response header.
- [x] CSP baseline.
- [x] Anti-framing policy.
- [x] MIME-sniffing protection.
- [x] Restricted browser permissions; camera remains available for inventory scanning.
- [x] Private route `no-store` and `X-Robots-Tag` headers.
- [x] `robots.txt` excludes authenticated/API areas.
- [x] Dynamic public sitemap.
- [x] Privacy-safe health endpoint.
- [x] Branded global error and 404 handling.
- [x] Committed npm lockfile and reproducible `npm ci` validation.
- [x] Production dependency audit at high severity in CI.
- [x] Standalone TypeScript validation in CI.
- [x] Production-server smoke tests for security headers, robots rules and private-cache/indexing behavior.
- [x] Visible keyboard focus safeguards and reduced-motion support.
- [ ] Automated accessibility audit plus manual keyboard/screen-reader pass on deployed pages.
- [ ] Cross-browser/mobile acceptance matrix on the deployed release candidate.
- [ ] Production error-reporting provider / alert destination.
- [ ] Uptime monitor pointed at `/api/health`.

## Upload and abuse controls

Already enforced:

- private/public bucket separation
- RLS ownership/role checks
- per-object size limits
- MIME allowlists
- filename extension allowlists
- resumable upload flow
- anonymous users cannot upload patient records

Still required before launch:

- determine whether real CBCT archives require more than the current 50 MB/object limit; raise the Supabase global + bucket limit deliberately if necessary
- define per-patient/storage usage limits
- orphan-upload cleanup procedure
- malware/file-content scanning strategy for untrusted uploaded documents, especially PDF/ZIP content
- final hosting-layer WAF/rate-limit rules for public assistant and authentication traffic

## SEO/content launch gate

Before indexing the final site:

- final logo and identity
- verified doctor portrait and complete doctor CV/registration details
- real clinic photography
- first consented Signature Cases
- doctor-approved treatment descriptions and FAQs
- page-specific titles/descriptions/canonicals for all important public pages
- structured data only for facts the clinic has verified
- redirect map from the previous site

## Privacy/legal launch gate

A healthcare/privacy notice, terms, consent language, retention schedule and international-patient data handling policy require clinic/legal approval. Do not generate public legal guarantees from engineering assumptions.

## Launch approval

Production launch is approved only when:

1. security advisor is clean,
2. CI is green on the exact release SHA,
3. production Supabase availability + backup + Storage recovery is operational and restore-tested,
4. real role provisioning is verified,
5. external integrations pass controlled acceptance tests,
6. privacy/legal content is approved,
7. public clinical claims/content are verified,
8. mobile/accessibility/browser acceptance passes,
9. monitoring/alerts are operational,
10. the final release receives explicit Owner approval.
