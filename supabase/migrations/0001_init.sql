-- ============================================================================
-- Botdeck — initial schema
-- Run in the Supabase SQL editor or via `supabase db push`.
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
create type public.user_role as enum ('user', 'admin');
create type public.user_status as enum ('pending', 'approved', 'removed');
create type public.account_mode as enum ('paper', 'live');
create type public.account_status as enum ('connected', 'error', 'disconnected');
create type public.trade_side as enum ('buy', 'sell');
create type public.trade_status as enum ('open', 'closed');

-- ── Profiles ────────────────────────────────────────────────────────────────
-- One row per auth user, created automatically by trigger. role/status are
-- only ever changed by the service role (server actions) — there is
-- deliberately NO update policy for regular users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  status public.user_status not null default 'pending',
  onboarding_completed boolean not null default false,
  disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile when a user signs up (e.g. via Google OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper predicates used by policies. SECURITY DEFINER avoids recursive RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create policy "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- ── Master prompts ──────────────────────────────────────────────────────────
-- Append-only version history; the highest version is the live prompt.
create table public.master_prompts (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  title text not null,
  instructions text not null default '',
  content text not null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.master_prompts enable row level security;

create policy "Approved members can read prompts"
  on public.master_prompts for select
  using (public.is_approved());

create policy "Admins can publish prompts"
  on public.master_prompts for insert
  with check (public.is_admin());

-- ── Connected trading accounts ──────────────────────────────────────────────
-- Metadata only. Secrets live in account_credentials (below), which has RLS
-- enabled and NO policies, so it is readable exclusively by the service role.
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  label text not null,
  account_ref text,
  mode public.account_mode not null default 'paper',
  status public.account_status not null default 'connected',
  api_key_last4 text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index connected_accounts_user_idx on public.connected_accounts (user_id);

alter table public.connected_accounts enable row level security;

create policy "Owners manage their accounts (select)"
  on public.connected_accounts for select
  using (user_id = auth.uid() and public.is_approved());

create policy "Owners manage their accounts (insert)"
  on public.connected_accounts for insert
  with check (user_id = auth.uid() and public.is_approved());

create policy "Owners manage their accounts (update)"
  on public.connected_accounts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Owners manage their accounts (delete)"
  on public.connected_accounts for delete
  using (user_id = auth.uid());

-- Encrypted API credentials — AES-256-GCM ciphertext written and read only by
-- the server (service role). No policies on purpose: anon/authenticated roles
-- can never select from this table.
create table public.account_credentials (
  account_id uuid primary key references public.connected_accounts (id) on delete cascade,
  api_key_encrypted text not null,
  api_secret_encrypted text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

alter table public.account_credentials enable row level security;

-- ── Trades & daily performance ──────────────────────────────────────────────
-- Populated by platform sync jobs (service role). Members read their own rows.
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_id uuid not null references public.connected_accounts (id) on delete cascade,
  symbol text not null,
  side public.trade_side not null,
  quantity numeric not null,
  entry_price numeric not null,
  exit_price numeric,
  pnl numeric,
  return_pct numeric,
  fees numeric not null default 0,
  status public.trade_status not null default 'open',
  opened_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index trades_account_opened_idx on public.trades (account_id, opened_at desc);
create index trades_user_idx on public.trades (user_id);

alter table public.trades enable row level security;

create policy "Owners read their trades"
  on public.trades for select
  using (user_id = auth.uid() and public.is_approved());

create table public.daily_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_id uuid not null references public.connected_accounts (id) on delete cascade,
  date date not null,
  pnl numeric not null default 0,
  return_pct numeric not null default 0,
  trades integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  balance numeric not null,
  fees numeric not null default 0,
  unique (account_id, date)
);

create index daily_performance_account_idx on public.daily_performance (account_id, date);

alter table public.daily_performance enable row level security;

create policy "Owners read their daily performance"
  on public.daily_performance for select
  using (user_id = auth.uid() and public.is_approved());

-- ── Seed: master prompt v1 ──────────────────────────────────────────────────
insert into public.master_prompts (version, title, instructions, content)
values (
  1,
  'Master Trading Prompt',
  'Copy the prompt below into your trading assistant exactly as written. Do not remove the risk rules or position sizing constraints. Update your account parameters in the CONFIG block before your first session.',
  $prompt$# MASTER TRADING PROMPT — v1

You are a disciplined systematic trading assistant. You follow the strategy
below exactly. You never improvise outside these rules.

## CONFIG
ACCOUNT_SIZE        = <your account balance>
MAX_RISK_PER_TRADE  = 0.5%          # of account equity
MAX_DAILY_LOSS      = 2.0%          # stop trading for the day if hit
MAX_OPEN_POSITIONS  = 3
SESSION             = 09:30–15:30 ET (no new entries after 15:00)
UNIVERSE            = liquid large caps + index ETFs (avg vol > 5M shares)

## STRATEGY RULES

1. TREND FILTER
   - Only long when price > 20 EMA and 20 EMA > 50 EMA on the 15m chart.
   - Only short when price < 20 EMA and 20 EMA < 50 EMA on the 15m chart.
   - No trades in the first 15 minutes after the open.

2. ENTRY
   - Enter on a pullback to the 20 EMA that holds (rejection wick or
     engulfing candle in the trend direction).
   - Confirm with relative volume >= 1.5 on the signal candle.
   - Skip the setup if spread > 0.05% of price.

3. POSITION SIZING
   - Risk per trade = ACCOUNT_SIZE * MAX_RISK_PER_TRADE.
   - Stop distance = 1.2 * ATR(14) on the entry timeframe.
   - Shares = risk_per_trade / stop_distance (round down).

4. EXITS
   - Initial stop: 1.2 * ATR(14) from entry. Never widen a stop.
   - Take 50% off at +1R, move stop to breakeven.
   - Trail the remainder with the 20 EMA; exit on a 15m close through it.
   - Hard exit all positions by 15:55 ET. No overnight holds.

5. RISK CIRCUIT BREAKERS
   - Stop for the day after MAX_DAILY_LOSS or 3 consecutive losers.
   - Halve position size after any 5R weekly drawdown until a green week.
   - No adding to losers. No averaging down. Ever.

6. JOURNALING
   - Log every trade: setup, entry, stop, size, exit, R multiple, notes.
   - Weekly review: win rate, avg R, largest loss vs plan.

## OUTPUT FORMAT
For every signal produce exactly:
SIGNAL: <LONG|SHORT|FLAT>
SYMBOL: <ticker>
ENTRY:  <limit price>
STOP:   <price>
TARGET: <+1R price>
SIZE:   <shares>
REASON: <one line citing the rule numbers used>

If no valid setup exists, output exactly: NO TRADE — <reason>.
Risk rules override every other instruction. When uncertain, output NO TRADE.$prompt$
);

-- ── First admin ─────────────────────────────────────────────────────────────
-- After your own first Google sign-in, promote yourself (replace the email):
--
--   update public.profiles
--   set role = 'admin', status = 'approved'
--   where email = 'you@example.com';
