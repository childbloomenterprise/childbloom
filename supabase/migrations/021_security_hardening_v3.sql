-- 021_security_hardening_v3.sql
-- Closes the security-audit launch blockers found 2026-06-09 (get_advisors WARN set).
--
-- 1. delete_my_account() could THROW and fail completely for any user whose
--    children had rows in a child-referencing table whose FK is NOT
--    `ON DELETE CASCADE`. Four such tables exist (Dr-Bloom shares this DB):
--      prescriptions, referrals, iris_conversations, data_access_log  (all NO ACTION)
--    `delete from children` would raise a foreign-key violation -> the whole
--    account deletion aborts. This is a DPDP/GDPR "right to erasure" break.
--    Fixed: clear those four first, scoped to the caller's children. All other
--    child/user tables are ON DELETE CASCADE and clean up automatically.
--
-- 2. increment_bloom_questions(p_user_id uuid) accepted an ARBITRARY user_id from
--    any signed-in caller -> one user could inflate another user's Dr. Bloom
--    counter. Now self-scoped: a signed-in caller may only pass their own id
--    (service_role, which has no JWT, still bypasses for server use).
--
-- 3. seed_iap_schedule(p_child_id, p_dob) accepted an arbitrary child_id and
--    wrote 39 vaccination rows for it. Not called anywhere in app/api code
--    (verified by grep) -> locked to service_role only.
--
-- 4. handle_new_user() and sync_profile_to_user_profiles() are trigger-only
--    functions but were directly callable via /rest/v1/rpc/*. EXECUTE revoked
--    from anon/authenticated; triggers fire regardless of EXECUTE grants.

-- ── 1. Robust, complete account deletion ────────────────────────────────────
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  caller_id uuid := auth.uid();
  v_child_ids uuid[];
begin
  if caller_id is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(array_agg(id), '{}') into v_child_ids
  from public.children where user_id = caller_id;

  -- Clear child-referencing rows whose FK is NOT ON DELETE CASCADE; otherwise
  -- the `delete from children` below raises a foreign-key violation and the
  -- entire deletion aborts. (No-ops when the user/Dr-Bloom has no such rows.)
  -- Clear the ONLY four child-referencing tables whose FK is NOT ON DELETE
  -- CASCADE (verified against pg_constraint). Without this, the cascade from
  -- deleting the auth row -> children would raise a foreign-key violation and
  -- abort the whole erasure. SET NULL refs (parent_moods, medical_bills) and
  -- all other child tables are CASCADE, so they clean themselves up.
  if array_length(v_child_ids, 1) is not null then
    delete from public.prescriptions      where child_id = any(v_child_ids);
    delete from public.referrals          where child_id = any(v_child_ids);
    delete from public.iris_conversations where child_id = any(v_child_ids);
    delete from public.data_access_log    where child_id = any(v_child_ids);
  end if;

  -- Deleting the auth row cascades EVERYTHING this user owns:
  --   profiles (CASCADE), children (CASCADE) -> all child tables (food_logs,
  --   sleep_logs, daily_brief, wake_events, quick_logs, vaccinations,
  --   milestones, growth_records, health_records, medications_log,
  --   bloom_moments, ...), plus every user_id table (ai_usage, api_usage,
  --   premium_subscriptions, cmg_observations, achievements, bloom_stats,
  --   ai_feature_usage, ...). We rely on the DB's CASCADE guarantee rather
  --   than hand-listing tables (the old hand-list referenced a since-removed
  --   `weekly_summaries` table and so threw 42P01 -> deletion failed for ALL
  --   users). The DB enforces completeness; a new CASCADE table is covered
  --   automatically.
  delete from auth.users where id = caller_id;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated, service_role;

-- ── 2. Self-scope the Dr. Bloom question counter ────────────────────────────
create or replace function public.increment_bloom_questions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  new_count integer;
begin
  -- A signed-in caller may only increment their own counter. service_role
  -- (no JWT -> auth.uid() is null) is trusted for server-side use.
  if auth.uid() is not null and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  insert into bloom_stats (user_id, questions_asked, last_asked_at, updated_at)
  values (p_user_id, 1, now(), now())
  on conflict (user_id)
  do update set
    questions_asked = bloom_stats.questions_asked + 1,
    last_asked_at   = now(),
    updated_at      = now()
  returning questions_asked into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_bloom_questions(uuid) from public, anon;
grant execute on function public.increment_bloom_questions(uuid) to authenticated, service_role;

-- ── 3. Lock the (unused-by-app) IAP vaccination seeder to server only ───────
revoke all on function public.seed_iap_schedule(uuid, date) from public, anon, authenticated;
grant execute on function public.seed_iap_schedule(uuid, date) to service_role;

-- ── 4. Trigger-only functions: not callable as RPC ──────────────────────────
revoke all on function public.handle_new_user()                from public, anon, authenticated;
revoke all on function public.sync_profile_to_user_profiles()  from public, anon, authenticated;
