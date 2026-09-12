<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Base44 Dev Environment

### Stack
Vite + TanStack Start (SSR) + React 19. Lovable-generated project. Single-origin
dev server on port 3000 (no separate backend service).

### Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Node 22 slim image, source bind-mounted at `/app`, `npm install` + `vite dev` on start.
- Live reload via Vite HMR — edits appear without restart.
- Healthcheck: `GET /` on port 3000.

### Environment
- `.env`, `.env.development` etc. are committed with public client-side values (Supabase URL/publishable key, Vapi, Firebase config, Stripe publishable key).
- Server-side secrets (Supabase service role key, Stripe API keys, Lovable API key, Vapi server secret) are NOT in the repo. Placeholder defaults live in `.env.base44-defaults` so the app boots; real values come from `/run/base44/app.env` (Base44 Secrets dashboard).
- `GHL_INBOUND_WEBHOOK_URL` is optional — form submissions work without it.

### What works without secrets
All public pages (home, services, pricing, case study, audit, about, process, privacy).
Auth, payments, and server-side data operations need real credentials.

### Tests
```
npm test        # vitest unit tests
npm run lint    # eslint
```
