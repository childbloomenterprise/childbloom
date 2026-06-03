-- 015_account_deletion_hardened.sql
-- Re-creates delete_my_account() with explicit table deletes as belt-and-suspenders.
-- The auth.users delete cascades anything missed, but explicit deletes ensure
-- premium_subscriptions and ai_usage are always removed even if the FK cascade
-- was not set up on an older schema version.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Explicit deletes for tables that may not cascade automatically.
  -- Order matters: child-owned tables first, then parent tables.
  delete from public.cmg_observations   where user_id  = caller_id;
  delete from public.weekly_summaries   where user_id  = caller_id;
  delete from public.ai_usage           where user_id  = caller_id;
  delete from public.premium_subscriptions where user_id = caller_id;
  delete from public.api_usage          where user_id  = caller_id;

  -- Deleting children cascades: food_logs, growth_records, health_records,
  -- weekly_updates, vaccinations, bloom_moments, sleep_logs, medical_bills,
  -- doctor_child_connections (all have child_id FK → children with ON DELETE CASCADE).
  delete from public.children where user_id = caller_id;

  -- Profile row (FK to auth.users, may or may not cascade depending on schema version)
  delete from public.profiles where id = caller_id;

  -- Delete the auth row last — this cascades anything the explicit deletes missed.
  delete from auth.users where id = caller_id;
end;
$$;

-- Permissions unchanged from migration 012
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
