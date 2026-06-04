-- 017_ai_feature_usage.sql
-- Per-feature weekly AI quota metering for Phase-1 retention features.
--
-- Why a NEW table instead of reusing public.ai_usage?
-- ai_usage is a single shared weekly bucket consumed by Dr. Bloom
-- (consumeFreeQuota in api/lib/premium.js). If the myth-buster and voice
-- log-parser also drew from it, those features would cannibalise Dr. Bloom's
-- 5/week free allowance (and vice-versa). This table keeps an INDEPENDENT
-- counter per (user, feature, week) so each free cap is enforced on its own.
--
-- Written ONLY by the service role (server). Users can READ their own rows.
-- Idempotent + self-contained — safe to paste into the Supabase SQL editor.

create table if not exists public.ai_feature_usage (
  user_id    uuid not null references auth.users (id) on delete cascade,
  feature    text not null,            -- e.g. 'myth_check' | 'voice_parse'
  week_start date not null,            -- Monday-based ISO week start (UTC)
  count      integer not null default 0,
  primary key (user_id, feature, week_start)
);

alter table public.ai_feature_usage enable row level security;

-- Owners may READ their own usage. No insert/update/delete policy exists,
-- so anon/authenticated keys CANNOT write here — only the service role can.
drop policy if exists "own feature usage read" on public.ai_feature_usage;
create policy "own feature usage read"
  on public.ai_feature_usage
  for select
  using (auth.uid() = user_id);
