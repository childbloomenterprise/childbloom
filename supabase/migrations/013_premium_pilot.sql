-- 013_premium_pilot.sql
-- Manual UPI premium pilot: premium status + free AI usage metering.
-- Status is written ONLY by the service role (server) — users cannot self-grant.

-- ── Premium subscriptions ──────────────────────────────────────────────
create table if not exists public.premium_subscriptions (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  status           text not null default 'active',      -- 'active' | 'cancelled'
  plan             text not null default 'monthly',
  amount_inr       integer not null default 179,
  premium_until    timestamptz,
  last_payment_ref text,                                -- UPI txn id / note
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.premium_subscriptions enable row level security;

-- Owners may READ their own status. No insert/update/delete policy exists,
-- so the anon/authenticated keys CANNOT write here — only the service role can.
drop policy if exists "own premium read" on public.premium_subscriptions;
create policy "own premium read"
  on public.premium_subscriptions
  for select
  using (auth.uid() = user_id);

-- ── Free AI usage metering (Dr. Bloom) ─────────────────────────────────
create table if not exists public.ai_usage (
  user_id    uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  count      integer not null default 0,
  primary key (user_id, week_start)
);

alter table public.ai_usage enable row level security;

drop policy if exists "own usage read" on public.ai_usage;
create policy "own usage read"
  on public.ai_usage
  for select
  using (auth.uid() = user_id);

-- ── Owner helpers (run from Supabase SQL editor after WhatsApp confirms) ─
-- Grant premium:  select public.grant_premium('parent@email.com', 30, 'GPay txn 1234');
create or replace function public.grant_premium(p_email text, p_days integer default 30, p_ref text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email) limit 1;
  if v_uid is null then
    return 'NO USER WITH EMAIL: ' || p_email;
  end if;

  insert into public.premium_subscriptions (user_id, status, premium_until, last_payment_ref, updated_at)
  values (v_uid, 'active', now() + make_interval(days => p_days), p_ref, now())
  on conflict (user_id) do update
    set status        = 'active',
        premium_until = greatest(coalesce(premium_subscriptions.premium_until, now()), now()) + make_interval(days => p_days),
        last_payment_ref = coalesce(p_ref, premium_subscriptions.last_payment_ref),
        updated_at    = now();

  return 'PREMIUM GRANTED to ' || p_email || ' for ' || p_days || ' days';
end;
$$;

-- Revoke premium:  select public.revoke_premium('parent@email.com');
create or replace function public.revoke_premium(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email) limit 1;
  if v_uid is null then return 'NO USER WITH EMAIL: ' || p_email; end if;
  update public.premium_subscriptions set status = 'cancelled', updated_at = now() where user_id = v_uid;
  return 'PREMIUM REVOKED for ' || p_email;
end;
$$;
