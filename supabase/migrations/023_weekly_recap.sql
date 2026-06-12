-- 023_weekly_recap.sql
-- Weekly Bloom Recap — one shareable week-in-review per child per week.
-- stats jsonb holds raw counts (feeds, sleepHours, sleepSessions, diapers,
-- daysLogged, streakEnd, growthLogged); highlight is a one-liner from Claude
-- in the parent's language. Written ONLY by the cron (service role) every
-- Monday; parents READ their own. Mirrors 018_daily_brief.sql exactly.
-- Idempotent + self-contained — safe to paste into the Supabase SQL editor.

create table if not exists public.weekly_recap (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id) on delete cascade,
  user_id     uuid not null references auth.users (id)      on delete cascade,
  week_start  date not null,
  stats       jsonb not null default '{}'::jsonb,
  highlight   text,
  lang        text not null default 'en',
  created_at  timestamptz not null default now(),
  unique (child_id, week_start)
);

create index if not exists weekly_recap_child_week_idx
  on public.weekly_recap (child_id, week_start desc);

alter table public.weekly_recap enable row level security;

-- Owners may READ their own recaps. No insert/update/delete policy exists,
-- so only the service role (cron) can write.
drop policy if exists "own recap read" on public.weekly_recap;
create policy "own recap read"
  on public.weekly_recap
  for select
  using (auth.uid() = user_id);
