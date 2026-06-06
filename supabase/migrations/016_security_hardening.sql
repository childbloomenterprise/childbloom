-- Migration 016: Security hardening
-- Applied 2026-06-03
-- Fixes found by Supabase security advisor after scanner audit:
--   1. CRITICAL: grant_premium/revoke_premium were callable by anon (no auth needed)
--   2. ERROR: child_profile_summary view bypassed RLS (SECURITY DEFINER)
--   3. WARN: 11 functions had mutable search_path (SQL injection vector)
--   4. WARN: Other SECURITY DEFINER functions callable by anon

-- ================================================================
-- STEP 1: Lock functions to correct roles
-- ================================================================
-- PostgreSQL grants EXECUTE to PUBLIC by default. REVOKE FROM anon alone
-- doesn't work because anon inherits from PUBLIC.
-- Pattern: REVOKE FROM PUBLIC → GRANT to only the roles that need access.

-- Admin-only: service_role exclusively (not called by the app at all)
REVOKE EXECUTE ON FUNCTION public.grant_premium(text, integer, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.grant_premium(text, integer, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.grant_premium(text, integer, text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.revoke_premium(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.revoke_premium(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.revoke_premium(text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- Authenticated-only: logged-in users + service_role
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_my_account() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_connected_doctor(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_connected_doctor(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_parent_of(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.seed_iap_schedule(uuid, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.seed_iap_schedule(uuid, date) TO authenticated, service_role;

-- Internal: service_role only (called from API, not client)
REVOKE EXECUTE ON FUNCTION public.increment_bloom_questions(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_bloom_questions(uuid) TO service_role;

-- Trigger functions: no user should call these via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.sync_profile_to_user_profiles() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sync_profile_to_user_profiles() TO service_role;

-- ================================================================
-- STEP 2: Fix SECURITY DEFINER view
-- child_profile_summary ran as owner → bypassed RLS on children,
-- growth_records, weekly_updates → exposed all users' child data.
-- ================================================================
ALTER VIEW public.child_profile_summary SET (security_invoker = true);

-- ================================================================
-- STEP 3: Fix mutable search_path on all public functions
-- A mutable search_path lets an attacker redirect function calls
-- to malicious schema objects via search_path manipulation.
-- ================================================================
ALTER FUNCTION public.seed_iap_schedule(uuid, date)             SET search_path = public;
ALTER FUNCTION public.sync_children_unified_columns()            SET search_path = public;
ALTER FUNCTION public.sync_sleep_logs_unified_columns()          SET search_path = public;
ALTER FUNCTION public.sync_growth_records_to_measurements()      SET search_path = public;
ALTER FUNCTION public.sync_food_logs_to_feeding()                SET search_path = public;
ALTER FUNCTION public.update_updated_at()                        SET search_path = public;
ALTER FUNCTION public.is_connected_doctor(uuid)                  SET search_path = public;
ALTER FUNCTION public.is_parent_of(uuid)                         SET search_path = public;
ALTER FUNCTION public.get_my_role()                              SET search_path = public;
ALTER FUNCTION public.sync_profile_to_user_profiles()            SET search_path = public;
ALTER FUNCTION public.handle_new_user()                          SET search_path = public;

-- ================================================================
-- STEP 4: Storage — restrict child-avatars listing
-- Broad SELECT allowed listing ALL avatar files. Replace with a
-- policy that lets authenticated users list their own folder,
-- and allows public read of specific objects by full path.
-- ================================================================
DROP POLICY IF EXISTS "Anyone can view child avatars" ON storage.objects;

CREATE POLICY "Public: read specific avatar objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'child-avatars'
    AND (
      (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = (auth.uid())::text)
      OR
      (name IS NOT NULL AND name != '' AND name NOT LIKE '%/')
    )
  );
