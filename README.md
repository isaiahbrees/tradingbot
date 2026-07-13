# Botdeck — Private Trading Bot Community

A Vercel-inspired dashboard for a private trading bot community: Google sign-in with
admin approval, a read-only master prompt, and a full trading performance dashboard.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (Postgres + Auth) · Recharts · Geist Sans / Geist Mono**.

## Features

- **Google login** via Supabase Auth, with session refresh in middleware
- **Admin approval system** — new sign-ins wait on a "pending approval" screen until
  an admin approves them; admins manage members at `/admin/users` and `/admin/approvals`
- **Onboarding** — welcome → risk disclaimer → connect a trading account → dashboard
- **Master Prompt** (`/prompt`) — versioned, read-only code-style viewer with Copy and
  Download; only admins can publish new versions at `/admin/prompt`
- **Overview** — P&L stat tiles, account growth chart with date-range filter, and
  daily / weekly / monthly breakdowns
- **Trades** — every trade with filters (range, symbol, result, status) and a detail
  side panel
- **Performance** — deep analytics: drawdown, averages, largest win/loss, fees,
  best/worst day, daily/weekly/monthly P&L charts
- **Connected Accounts** — connect / reconnect / remove accounts, paper ↔ live switch;
  API credentials are AES-256-GCM encrypted at rest and never displayed again
- **Demo Mode** — deterministic, realistic demo data (270 days, drawdowns, open
  trades) with a clear badge until real platform syncs land
- Dark & light mode, skeleton loading states, empty states, responsive layout

## Local preview (zero setup)

```bash
npm install
npm run dev
```

With no `.env` file the app runs in **local preview mode**: auth is bypassed with a
demo admin session and all data is generated demo data. This is for local exploration
only — configure Supabase before deploying anywhere real.

## Full setup (Supabase + Google)

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/migrations/0001_init.sql`.

### 2. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com) create an OAuth 2.0
   Client ID (Web application).
2. Add the authorized redirect URI shown in Supabase under
   **Authentication → Providers → Google** (looks like
   `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Paste the client ID and secret into the Supabase Google provider settings and
   enable it.
4. Under **Authentication → URL Configuration**, set your site URL and add
   `http://localhost:3000/**` plus your production domain to the redirect allow list.

### 3. Configure the app

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server-only) |
| `CREDENTIALS_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL |

### 4. Make yourself admin

Sign in with Google once (you'll land on the pending screen), then run in the SQL
editor:

```sql
update public.profiles
set role = 'admin', status = 'approved'
where email = 'you@example.com';
```

From then on you approve everyone else from **Admin → Account Approvals**.

### 5. Deploy to Vercel

Push the repo to GitHub, import it in Vercel, and add the same environment variables.
`SUPABASE_SERVICE_ROLE_KEY` and `CREDENTIALS_ENCRYPTION_KEY` must **not** be prefixed
with `NEXT_PUBLIC_` — they are server-only secrets.

## Security model

- **Profiles** — users can only read their own row; there is *no* client update path.
  Role/status/onboarding changes run through server actions using the service role,
  so nobody can approve themselves.
- **Credentials** — `account_credentials` has RLS enabled with no policies, so it is
  unreadable by client sessions entirely. API keys/secrets are encrypted server-side
  with AES-256-GCM before insert; only the last 4 characters of the key are stored in
  the visible table for display.
- **Master prompt** — append-only versions; insert is restricted to approved admins.
  Members render it in a read-only viewer (no editable field exists outside
  `/admin/prompt`).

## Live platform sync (Tradier & Alpaca)

Accounts on platforms with a sync adapter import real trade history:

- **Tradier** — connect with your access token as the API key (no secret).
  Paper mode uses the sandbox host.
- **Alpaca** — connect with API key + secret. Paper mode uses `paper-api`.

How it works: the sync engine (`src/lib/sync/`) decrypts the stored
credentials server-side, pulls fills and current equity from the platform,
pairs fills into round-trip trades (FIFO, longs and shorts), rebuilds
`trades` + `daily_performance`, and stamps `last_synced_at`. Once an account
has synced rows, every dashboard switches from demo to real data
automatically and the Demo badge disappears.

Triggers:
- **Sync now** — per-account menu action on the Connected Accounts page.
- **Daily cron** — `vercel.json` schedules `/api/cron/sync`; set a
  `CRON_SECRET` env var in Vercel to enable it (the endpoint rejects
  requests without it).

### Adding another platform

1. Add it to `PLATFORMS` in `src/lib/types.ts` with `autoSync: true`.
2. Write an adapter implementing `ProviderAdapter`
   (see `src/lib/sync/tradier.ts` for the pattern).
3. Register it in `ADAPTERS` in `src/lib/sync/engine.ts`. Done — the UI,
   cron, and Sync Now button pick it up automatically.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
