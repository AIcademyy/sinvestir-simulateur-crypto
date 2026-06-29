-- Run this once in the Supabase SQL editor of your project.
-- Powers "Mes simulations" (persistence) and the automation webhook payload.

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  coin_id text not null,
  coin_symbol text not null,
  amount numeric not null,
  frequency text not null,
  start_date date not null,
  end_date date not null,
  invested numeric not null,
  acquired numeric not null,
  final_capital numeric not null,
  performance_pct numeric not null,
  lead_email text
);

alter table public.simulations enable row level security;

-- Demo-only policy: anyone can read/insert. In production, scope this to
-- the authenticated user (e.g. `auth.uid() = user_id`) once auth is wired in.
create policy "public read" on public.simulations
  for select using (true);

create policy "public insert" on public.simulations
  for insert with check (true);

-- Shared cache for CoinGecko historical price series. See src/lib/coingecko.ts.
create table if not exists public.price_cache (
  cache_key text primary key,
  prices jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.price_cache enable row level security;

create policy "public read" on public.price_cache
  for select using (true);

create policy "public upsert" on public.price_cache
  for insert with check (true);

create policy "public update" on public.price_cache
  for update using (true);
