-- 027_unify_stage5_doctor_read_growth_food.sql
-- Stage 5 of the Dr. Bloom <-> ChildBloom unification: restore connected-doctor
-- read access on the canonical growth/feeding tables.
--
-- In migration 025 the duplicate tables growth_measurements + feeding_logs became
-- security_invoker VIEWS over growth_records + food_logs. The old physical tables
-- carried a "Connected doctor: read" RLS policy; a security_invoker view defers to
-- the UNDERLYING table's RLS, so a doctor reading the view with their own token
-- needs the read grant on growth_records / food_logs.
--
-- Dr. Bloom currently reads via the service role (RLS bypassed), so this is
-- additive defense-in-depth + parity restoration, and prepares for moving doctor
-- reads onto the user token after the auth cutover. is_connected_doctor(child_id)
-- is the existing SECURITY DEFINER helper (true when the caller has an active
-- connection to the child). Idempotent.

drop policy if exists "Connected doctor: read growth_records" on public.growth_records;
create policy "Connected doctor: read growth_records"
  on public.growth_records for select
  using (is_connected_doctor(child_id));

drop policy if exists "Connected doctor: read food_logs" on public.food_logs;
create policy "Connected doctor: read food_logs"
  on public.food_logs for select
  using (is_connected_doctor(child_id));
