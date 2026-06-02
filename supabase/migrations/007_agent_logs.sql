-- 007_agent_logs.sql
-- Stores output from the social media agent cron (api/agent/cron.js)
-- and feeds the daily brief endpoint (api/agent/brief.js).

create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_logs_type_created_idx
  on agent_logs (type, created_at desc);

create index if not exists agent_logs_created_idx
  on agent_logs (created_at desc);

-- Service role bypasses RLS; this table is never read by the anon client.
alter table agent_logs enable row level security;
