# CI/CD and error tracking

## Environments

| Environment | Branch    | Env file          | `APP_ENV` / `VITE_APP_ENV` |
| ----------- | --------- | ----------------- | -------------------------- |
| development | any       | `.env.development` | `development`              |
| staging     | `staging` | `.env.staging`    | `staging`                  |
| production  | `main`    | `.env.production` | `production`               |

Lovable hosting remains primary (preview = staging, `theroyeffect.com` = production).
The GitHub Actions pipeline additionally builds and deploys a Cloudflare Workers
mirror so deploys are reproducible outside Lovable.

## Workflows

- `.github/workflows/ci.yml` — runs on every PR and push to `main`/`staging`:
  lint, typecheck, unit tests, production build.
- `.github/workflows/deploy.yml` — runs on push to `staging` (staging worker) and
  `main` (production worker), or manually via *Run workflow*. It repeats the
  quality gates, builds with `--mode <env>`, uploads source maps to Sentry, then
  deploys with `wrangler deploy --env <env>` (see `wrangler.toml`).

## Required GitHub secrets

Add these in **Settings → Secrets and variables → Actions** (and per-environment
under **Settings → Environments → staging / production** if the values differ):

| Secret                  | Where to get it                                             |
| ----------------------- | ----------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare dashboard → My Profile → API Tokens (Edit Workers) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers overview                      |
| `SENTRY_DSN`            | Sentry → Project settings → Client Keys (public value)       |
| `SENTRY_AUTH_TOKEN`     | Sentry → Settings → Auth Tokens (`project:releases` scope)    |
| `SENTRY_ORG`            | Sentry org slug                                              |
| `SENTRY_PROJECT`        | Sentry project slug                                          |

Runtime secrets the worker needs (Stripe, Supabase, Vapi, email) must also be set
on the Cloudflare workers with `wrangler secret put <NAME> --env <env>`.

## Error tracking

- **Client** — `src/lib/sentry/client.ts`. The `@sentry/react` SDK is loaded
  dynamically only when `VITE_SENTRY_DSN` is set, so the default bundle is
  unchanged. Root error boundary failures are captured automatically.
- **Server** — `src/lib/sentry/server.ts`. The Cloudflare Worker runtime cannot
  host the Node/Cloudflare SDK here, so errors are posted straight to Sentry's
  envelope endpoint with `fetch`. Wired into the request middleware in
  `src/start.ts` and the SSR entry in `src/server.ts`.
- **Source maps** — `vite.config.ts` enables `build.sourcemap` and activates
  `@sentry/vite-plugin` only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and
  `SENTRY_PROJECT` are present (i.e. in CI). Maps are uploaded and then deleted
  from the build output, so they are never served publicly.
- **Releases** — every deploy tags events with the git SHA
  (`VITE_APP_RELEASE` / `APP_RELEASE`), so issues can be traced to a commit.

## Local smoke test

```bash
VITE_SENTRY_DSN="https://<key>@o0.ingest.sentry.io/<project>" bun run dev
```
