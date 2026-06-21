-- 024_doctor_data_parity_rls.sql
-- Stage 1 of the Dr. Bloom <-> ChildBloom unification: DATA PARITY.
--
-- Context: doctors authenticate in Dr. Bloom and write consultations,
-- prescriptions and vaccination_records into THIS (ChildBloom) project via the
-- service-role client. But parents had NO RLS read access to those tables:
--   * consultations          -> only "Doctor: full access" (doctor_id = auth.uid())
--   * prescriptions          -> doctor read/write only
--   * vaccination_records    -> RLS enabled with ZERO policies (deny-all)
-- So doctor-authored clinical data never appeared in the parent app — the parent
-- only ever got a realtime notification toast. This is the #1 "not Apple-smooth"
-- seam: the data flowed into the DB but was invisible to the family it belongs to.
--
-- Fix: additive SELECT policies that let a parent read the doctor-authored
-- clinical records for their OWN children. Nothing existing is removed or changed.
--
-- Ownership check reuses the existing is_parent_of(child_id) SECURITY DEFINER
-- helper (already used by the doctor_child_connections policies) so that
-- "can see the connection" and "can see the clinical data" stay perfectly
-- consistent. All 53 live children have parent_id populated (= user_id), so this
-- covers every existing family.
--
-- Idempotent: drop-if-exists before create so re-running is safe.

-- Doctor visit notes.
drop policy if exists "Parent: read consultations for own children" on public.consultations;
create policy "Parent: read consultations for own children"
  on public.consultations for select
  using (is_parent_of(child_id));

-- Prescriptions (active + past).
drop policy if exists "Parent: read prescriptions for own children" on public.prescriptions;
create policy "Parent: read prescriptions for own children"
  on public.prescriptions for select
  using (is_parent_of(child_id));

-- Vaccination records (doctor- or parent-sourced).
drop policy if exists "Parent: read vaccination_records for own children" on public.vaccination_records;
create policy "Parent: read vaccination_records for own children"
  on public.vaccination_records for select
  using (is_parent_of(child_id));
