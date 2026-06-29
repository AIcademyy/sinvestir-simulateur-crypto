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
