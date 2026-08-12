# JV Dental production readiness

This document is the launch gate for the JV Dental patient and clinic platform. A feature being implemented does not mean it is approved for real patient data.

## Current state

- Supabase project: `jvdental` (`awajvlxdifnkhngbdron`), Mumbai / `ap-south-1`.
- Supabase organization plan at the time of this review: **Free**.
- Supabase security advisor: clean after the production RLS hardening pass.
- Supabase performance advisor: no WARN-level findings after FK indexing, auth init-plan optimization and policy consolidation. INFO-level unused-index observations are intentionally retained until real workload data exists.
- Private patient Storage: 50 MB per object with server-side MIME + extension restrictions.
- Public case media Storage: 25 MB per object, JPEG/PNG/WebP/MP4 only.
- Application dependency versions are pinned; a committed package lock is required before launch.

## Blocker: backup and disaster recovery

Do not place production patient records in the current Free-plan project until an approved backup strategy is operational and a restore has been tested.

Supabase-managed daily database backups are a paid-plan capability. Database backups also do not contain the underlying Storage objects, so a database backup alone is not sufficient for JV Dental because radiographs, CBCT archives and clinical media are stored in Supabase Storage.

### Minimum launch requirement

1. Move the production Supabase organization/project to a plan with managed daily database backups, **or** operate a separately secured, audited logical database backup process.
2. Maintain an encrypted off-site copy of both Storage buckets independently of database backups.
3. Keep backup credentials outside this public GitHub repository.
4. Define retention and deletion periods with the clinic's privacy/legal policy before production use.
5. Perform a restore drill to a non-production project using synthetic/test data.
6. Record the restore date, operator, recovery point, recovery duration and any missing assets.
7. Repeat restore drills after meaningful schema/storage changes and periodically during operations.

### Suggested operational targets for launch

- Database recovery point objective: no more than 24 hours initially; consider PITR later if the clinic requires a tighter target.
- Storage recovery point objective: no more than 24 hours.
- Restore test: before launch and after major infrastructure changes.
- Never use production patient data for restore testing in developer environments.

These are internal engineering targets, not legal/compliance guarantees.

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
- Add production-grade edge/CDN abuse controls before public launch.

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
- [ ] Committed npm lockfile and `npm ci` validation.
- [ ] Automated accessibility checks and manual keyboard/screen-reader pass.
- [ ] Cross-browser/mobile acceptance matrix.
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
- malware/file-content scanning strategy for untrusted uploaded documents
- production edge/CDN rate limiting for public AI and authentication abuse

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
3. backup + Storage recovery is operational and restore-tested,
4. real role provisioning is verified,
5. external integrations pass controlled acceptance tests,
6. privacy/legal content is approved,
7. public clinical claims/content are verified,
8. mobile/accessibility/browser acceptance passes,
9. monitoring/alerts are operational,
10. the final release receives explicit Owner approval.
