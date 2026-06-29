-- Shared cache for CoinGecko historical price series, keyed by
-- "{coinId}:{startDate}:{endDate}". See src/lib/coingecko.ts.

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
