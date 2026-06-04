-- 019_wake_events.sql
-- Sleep SweetSpot — lightweight "baby just woke up" markers.
--
-- The app's sleep logger (SleepQuickSheet) stores hours_slept, not a reliable
-- wake timestamp, so SweetSpot needs its own signal to compute the next ideal
-- nap/bedtime window. This table holds one tiny row per "she just woke up" tap.
-- Parents write these DIRECTLY under RLS (no server round-trip) so the card is
-- instant and free — hence owner insert/read/delete policies (not service-only).
-- Idempotent + self-contained — safe to paste into the Supabase SQL editor.

create table if not exists public.wake_events (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children (id) on delete cascade,
  user_id    uuid not null references auth.users (id)      on delete cascade,
  woke_at    timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists wake_events_child_woke_idx
  on public.wake_events (child_id, woke_at desc);

alter table public.wake_events enable row level security;

drop policy if exists "users read own wake events" on public.wake_events;
create policy "users read own wake events"
  on public.wake_events for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own wake events" on public.wake_events;
create policy "users insert own wake events"
  on public.wake_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "users delete own wake events" on public.wake_events;
create policy "users delete own wake events"
  on public.wake_events for delete
  using (auth.uid() = user_id);
