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

## Adding a real platform integration

1. Add the platform to `PLATFORMS` in `src/lib/types.ts` (this makes it selectable).
2. Build a sync job (cron/edge function) that decrypts credentials with
   `decryptSecret`, pulls fills from the platform API, and writes `trades` +
   `daily_performance` rows with the service role.
3. Swap `getAccountData` in `src/lib/data.ts` to read those tables when an account
   has synced data — the entire UI (charts, tables, stats, Demo badge) already keys
   off that one function.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
