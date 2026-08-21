# JV Dental Cloudflare production release

This runbook is for production releases of the full-stack Next.js application to Cloudflare Workers.

## Current deployment model

- Production branch: `main`.
- Application package name / Worker identity: `jvdental`.
- Full-stack Next.js must deploy to **Cloudflare Workers**, not static Pages.
- The repository currently has no committed `wrangler.jsonc`, `wrangler.toml` or `open-next.config.ts`.
- Therefore the current Cloudflare path relies on Wrangler / Workers Builds automatic Next.js configuration.
- Do not add only a Wrangler config file by itself. A manual OpenNext migration must commit the adapter dependency, Wrangler dependency, OpenNext config, Wrangler config, package scripts and lockfile together, then pass a Worker-runtime preview before production promotion.

Cloudflare's current Next.js Workers guide supports automatic configuration by running `wrangler deploy` against an existing Next.js project. Cloudflare also recommends treating a committed Wrangler configuration as the source of truth once a project is moved to manual configuration.

## Workers Builds settings

Use the GitHub repository `mkraja826/jvdental` with production branch `main`.

For the current automatic configuration path:

- Deploy command: `npx wrangler deploy` unless the existing Cloudflare project already has an equivalent working deploy command.
- Preview deployments should remain enabled for non-production branches where practical.
- Do not point the full-stack application at a static Pages output directory.
- Keep all build-time environment variables in **Workers Builds → Build Variables and secrets**. Next.js may require both `NEXT_PUBLIC_*` values and server-only values while building routes.

Do not change the existing working Cloudflare build/deploy commands during a clinical release. Deployment-architecture changes should be isolated to their own preview-tested pull request.

## Required build variables / secrets

Use `.env.example` as the application inventory. At minimum, the deployed build must have the production values required by the enabled features, including:

- `NEXT_PUBLIC_SITE_URL=https://jvdental.com`
- production Supabase URL and publishable key
- Supabase service-role key for server-only operations
- configured booking-payment credentials when Razorpay booking payments are enabled
- all server-side integration secrets required by enabled Edge/API workflows

Never copy production secret values into GitHub, documentation or client-visible environment variables.

## Release sequence

1. Confirm the exact intended `main` SHA.
2. Confirm CI has passed typecheck, lint, production build and route/security smoke tests for that SHA.
3. Deploy that exact SHA through Cloudflare Workers Builds.
4. Confirm the production custom domain remains `jvdental.com` and is attached to the intended Worker.
5. Open `/api/health` on production.
6. Require `status: ok` and `database: ok`.
7. Require the reported build branch to be `main` and the reported commit to equal the intended SHA.
8. Sign in as clinic owner and open `/clinic/system-health`.
9. Review the measurable launch gates before accepting the release.
10. Smoke-test patient login, clinic login, password recovery, booking and one authenticated clinic route.
11. Confirm the homepage hero and doctor-profile media render from production.
12. Check Supabase database/Auth/Storage/Edge Function logs after the smoke test for new errors.
13. Record the accepted release SHA in the deployment/change log used by the clinic.

## Production smoke test

Public:

- `/`
- `/book`
- `/patient/login`
- `/staff/login`
- `/auth/forgot-password?audience=patient`
- `/auth/forgot-password?audience=staff`
- `/api/health`
- `robots.txt`
- `sitemap.xml`

Authenticated patient:

- overview
- intake
- documents
- messages
- treatment plan
- payments
- travel
- implant passport

Authenticated clinic:

- overview
- bookings
- consultations / estimates
- finance
- notifications
- inventory
- system health

## Do not promote if

Do not accept the production release when any of the following is true:

- `/api/health` is degraded or unavailable.
- the reported build SHA does not match the intended release SHA.
- the custom domain is serving the legacy site or another Worker.
- new Supabase authorization/storage errors appear during the smoke test.
- a critical patient or clinic route fails.
- a release introduces cross-patient data access, payment duplication, stock corruption or treatment-plan history mutation.

## Current external release gates

These are not controlled by application code and must be completed in the relevant dashboards/operational workflow:

- Supabase leaked-password protection enabled.
- production Supabase backup/Storage recovery strategy and restore drill completed.
- GitHub `main` branch protection / required CI checks enabled.
- Google Calendar / Meet connected and acceptance-tested if video consultations launch with it.
- Blogger connected and acceptance-tested if external publishing launches with it.
- real booking-payment acceptance test completed.
- real treatment-payment acceptance test completed.
- Dr. Jaya Prakash portrait uploaded and approved.
- all overdue consultations given a real clinic outcome.
- uptime/error alerting enabled.
- final mobile/browser/accessibility and doctor/owner acceptance completed.

## Moving from automatic to committed OpenNext configuration

Cloudflare currently recommends the OpenNext adapter for Next.js on Workers. If JV Dental later moves from automatic configuration to a source-controlled deployment configuration, do it in one isolated release:

1. install a current safe `@opennextjs/cloudflare` version and `wrangler` as project dependencies/dev dependencies as appropriate;
2. commit the regenerated npm lockfile;
3. add `open-next.config.ts`;
4. add `wrangler.jsonc` with `.open-next/worker.js`, `.open-next/assets`, `nodejs_compat`, a current compatibility date and the correct Worker name;
5. add `preview`, `deploy` and type-generation scripts;
6. build and preview in the Worker (`workerd`) runtime;
7. verify all server actions, authentication, uploads, Stripe/Razorpay routes and health checks in preview;
8. only then switch Workers Builds to the committed manual configuration.

Do not perform this migration inside an unrelated clinical/content release.
