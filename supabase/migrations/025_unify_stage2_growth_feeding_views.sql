-- 025_unify_stage2_growth_feeding_views.sql
-- Stage 2 of the Dr. Bloom <-> ChildBloom unification: collapse duplicate tables.
--
-- Background: growth_measurements + feeding_logs were physical tables kept in
-- sync from the canonical parent tables (growth_records, food_logs) by INSERT-only
-- triggers (trg_sync_growth_records / trg_sync_food_logs). Three problems:
--   1. Two sources of truth (drift risk).
--   2. The triggers fired AFTER INSERT only — so parent EDITS and DELETES never
--      propagated to the copies Dr. Bloom reads (stale clinical view).
--   3. profiles->user_profiles had only synced 65 of 237 rows (handled in Stage 3).
--
-- Only Dr. Bloom reads growth_measurements/feeding_logs, and only via the service
-- role (RLS bypassed); nothing writes them directly; no FKs reference them; the
-- ChildBloom client never touches them. Verified before applying: 0 orphan rows.
--
-- Fix: drop the triggers + duplicate tables, recreate the NAMES as VIEWS over the
-- canonical tables using the triggers' exact column mapping. Dr. Bloom's reads
-- (`select('*')` in lib/childbloom/fetch.ts) keep working unchanged — now always
-- live, single source of truth, edits/deletes reflected automatically.
--
-- security_invoker = true: the view defers to the underlying table's RLS, so the
-- service role still reads everything and any future authenticated caller gets
-- exactly the access growth_records/food_logs already grant.

-- 1. Remove the sync triggers + their functions.
drop trigger if exists trg_sync_growth_records on public.growth_records;
drop function if exists public.sync_growth_records_to_measurements();
drop trigger if exists trg_sync_food_logs on public.food_logs;
drop function if exists public.sync_food_logs_to_feeding();

-- 2. growth_measurements -> view over growth_records (bonus: bmi now computed).
drop table if exists public.growth_measurements cascade;
create view public.growth_measurements with (security_invoker = true) as
select
  gr.id,
  gr.child_id,
  gr.user_id                                                   as logged_by,
  'parent'::text                                               as source,
  gr.record_date::timestamptz                                  as measured_at,
  case when gr.weight_kg is not null then (gr.weight_kg * 1000)::int end as weight_grams,
  gr.height_cm,
  gr.head_circumference_cm,
  case when gr.weight_kg is not null and gr.height_cm is not null and gr.height_cm > 0
       then round((gr.weight_kg / ((gr.height_cm / 100.0) * (gr.height_cm / 100.0)))::numeric, 1)
  end                                                          as bmi,
  gr.notes,
  gr.created_at
from public.growth_records gr;

-- 3. feeding_logs -> view over food_logs.
drop table if exists public.feeding_logs cascade;
create view public.feeding_logs with (security_invoker = true) as
select
  fl.id,
  fl.child_id,
  fl.user_id                                                   as logged_by,
  coalesce(fl.logged_at, fl.created_at)                        as fed_at,
  'solid'::text                                                as feeding_type,
  fl.duration_minutes,
  null::int                                                    as amount_ml,
  fl.food_name                                                 as food_description,
  false                                                        as refused_food,
  fl.notes,
  fl.created_at
from public.food_logs fl;

-- 4. Grants so service-role (and future authenticated) reads resolve.
grant select on public.growth_measurements to anon, authenticated, service_role;
grant select on public.feeding_logs        to anon, authenticated, service_role;
