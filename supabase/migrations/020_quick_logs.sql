-- 020_quick_logs.sql
-- Quick logging — a home for one-tap / voice events that don't belong in the
-- richer trackers. Feed events still go to food_logs and sleep to sleep_logs
-- (so they keep counting in existing metrics); this table holds the lighter
-- 'diaper' and 'meds' events, with a jsonb payload so it stays flexible.
--
-- Parents own their rows and write them DIRECTLY under RLS (instant, no server).
-- Idempotent + self-contained — safe to paste into the Supabase SQL editor.

create table if not exists public.quick_logs (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children (id) on delete cascade,
  user_id    uuid not null references auth.users (id)      on delete cascade,
  type       text not null,                       -- 'diaper' | 'meds'
  logged_at  timestamptz not null default now(),
  logged_date date not null default (now() at time zone 'utc')::date,
  data       jsonb not null default '{}'::jsonb,  -- e.g. {"kind":"wet"} | {"name":"paracetamol","dose":"2.5ml"}
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists quick_logs_child_logged_idx
  on public.quick_logs (child_id, logged_at desc);

alter table public.quick_logs enable row level security;

drop policy if exists "users read own quick logs" on public.quick_logs;
create policy "users read own quick logs"
  on public.quick_logs for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own quick logs" on public.quick_logs;
create policy "users insert own quick logs"
  on public.quick_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own quick logs" on public.quick_logs;
create policy "users update own quick logs"
  on public.quick_logs for update
  using (auth.uid() = user_id);

drop policy if exists "users delete own quick logs" on public.quick_logs;
create policy "users delete own quick logs"
  on public.quick_logs for delete
  using (auth.uid() = user_id);
