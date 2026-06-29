-- Run this in the SQL editor if your `simulations` table already exists
-- (i.e. you ran schema.sql before this column was added).

alter table public.simulations
  add column if not exists lead_email text;
