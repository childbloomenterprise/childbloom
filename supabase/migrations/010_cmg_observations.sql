-- 010_cmg_observations.sql
-- Child Memory Graph observations — server-generated insights that surface
-- on the dashboard. Cached for 6h per child so we don't recompute every load.
--
-- This migration is OPTIONAL for the endpoint to work; without it, every
-- request just computes fresh (the endpoint detects the table's absence).

create table if not exists cmg_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,

  -- Observation payload
  kind text not null,                  -- 'pattern' | 'rhythm' | 'milestone' | ...
  eyebrow text,                        -- e.g. 'Pattern noticed'
  headline text not null,              -- e.g. 'Cluster-feeds in the evening'
  body text not null,
  tone text default 'calm',            -- 'calm' | 'positive' | 'attention'

  -- Cache metadata
  generated_at timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '6 hours'),

  -- Provenance (handy for debugging)
  input_summary jsonb default '{}'::jsonb,

  created_at timestamptz default now()
);

create index if not exists cmg_observations_child_expires_idx
  on cmg_observations (child_id, expires_at desc);

create index if not exists cmg_observations_user_idx
  on cmg_observations (user_id, generated_at desc);

alter table cmg_observations enable row level security;

drop policy if exists "users read own observations" on cmg_observations;
create policy "users read own observations"
  on cmg_observations for select
  using (auth.uid() = user_id);

drop policy if exists "service role writes observations" on cmg_observations;
-- No insert/update/delete policies — only the service-role serverless function
-- writes here. Authenticated clients are read-only.
