-- ChildBloom Migration 002: Birth profile fields + Vaccinations table
-- Run in Supabase SQL Editor after migration 001 (main schema)

-- ─────────────────────────────────────────────
-- Ensure all weekly_updates columns exist
-- (older databases may be missing several of these)
-- ─────────────────────────────────────────────
ALTER TABLE public.weekly_updates
  ADD COLUMN IF NOT EXISTS week_date        DATE,
  ADD COLUMN IF NOT EXISTS age_in_days      INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg        NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS height_cm        NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS mood             TEXT,
  ADD COLUMN IF NOT EXISTS sleep_hours      NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS sleep_quality    TEXT,
  ADD COLUMN IF NOT EXISTS motor_milestone  TEXT,
  ADD COLUMN IF NOT EXISTS new_skills       TEXT,
  ADD COLUMN IF NOT EXISTS feeding_notes    TEXT,
  ADD COLUMN IF NOT EXISTS concerns         TEXT,
  ADD COLUMN IF NOT EXISTS ai_insight       TEXT;

-- ─────────────────────────────────────────────
-- Add birth profile fields to children table
-- ─────────────────────────────────────────────
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS birth_weight_grams INTEGER,
  ADD COLUMN IF NOT EXISTS is_premature BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gestational_age_at_birth INTEGER,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS known_allergies TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.children.birth_weight_grams IS 'Birth weight in grams. Used by Dr. Bloom for growth context.';
COMMENT ON COLUMN public.children.is_premature IS 'Whether the child was born premature (before 37 weeks).';
COMMENT ON COLUMN public.children.gestational_age_at_birth IS 'Gestational age at birth in completed weeks. Required if is_premature = true.';
COMMENT ON COLUMN public.children.blood_group IS 'ABO blood group and Rh factor, e.g. A+, O-, AB+';
COMMENT ON COLUMN public.children.known_allergies IS 'Array of known allergies. Dr. Bloom always checks before food or medicine suggestions.';

-- ─────────────────────────────────────────────
-- child_profile_summary view
-- Uses scalar subqueries — avoids LATERAL join ambiguity issues
-- Orders weekly_updates by created_at (guaranteed column)
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.child_profile_summary AS
SELECT
  c.id                  AS child_id,
  c.user_id,
  c.name,
  c.date_of_birth,
  c.due_date,
  c.is_pregnant,
  c.gender,
  c.birth_weight_grams,
  c.is_premature,
  c.gestational_age_at_birth,
  c.blood_group,
  c.known_allergies,

  (SELECT gr.weight_kg
   FROM public.growth_records gr
   WHERE gr.child_id = c.id
   ORDER BY gr.record_date DESC LIMIT 1)             AS latest_weight_kg,

  (SELECT gr.height_cm
   FROM public.growth_records gr
   WHERE gr.child_id = c.id
   ORDER BY gr.record_date DESC LIMIT 1)             AS latest_height_cm,

  (SELECT gr.head_circumference_cm
   FROM public.growth_records gr
   WHERE gr.child_id = c.id
   ORDER BY gr.record_date DESC LIMIT 1)             AS latest_head_cm,

  (SELECT gr.record_date
   FROM public.growth_records gr
   WHERE gr.child_id = c.id
   ORDER BY gr.record_date DESC LIMIT 1)             AS latest_growth_date,

  (SELECT wu.week_date
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_checkin_date,

  (SELECT wu.mood
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_mood,

  (SELECT wu.sleep_hours
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_sleep_hours,

  (SELECT wu.sleep_quality
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_sleep_quality,

  (SELECT wu.motor_milestone
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_motor_milestone,

  (SELECT wu.new_skills
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_new_skills,

  (SELECT wu.feeding_notes
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_feeding_notes,

  (SELECT wu.concerns
   FROM public.weekly_updates wu
   WHERE wu.child_id = c.id
   ORDER BY wu.created_at DESC LIMIT 1)              AS latest_concerns

FROM public.children c;

-- ─────────────────────────────────────────────
-- Vaccinations table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id     UUID REFERENCES public.children(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  date_given   DATE,
  next_due     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'vaccinations'
      AND policyname = 'Users see own vaccinations'
  ) THEN
    CREATE POLICY "Users see own vaccinations"
      ON public.vaccinations FOR ALL
      USING (child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- IAP Vaccination Schedule seed function
-- Call from app: SELECT seed_iap_schedule('child-uuid', 'dob-date');
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_iap_schedule(p_child_id UUID, p_dob DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO public.vaccinations (child_id, vaccine_name, next_due) VALUES
  (p_child_id, 'BCG',                         p_dob),
  (p_child_id, 'Hepatitis B (birth dose)',     p_dob),
  (p_child_id, 'OPV 0 (birth dose)',           p_dob),
  (p_child_id, 'DTwP/DTaP 1',                 p_dob + 42),
  (p_child_id, 'IPV 1',                        p_dob + 42),
  (p_child_id, 'Hib 1',                        p_dob + 42),
  (p_child_id, 'Hepatitis B 2',                p_dob + 42),
  (p_child_id, 'Rotavirus 1',                  p_dob + 42),
  (p_child_id, 'PCV 1',                        p_dob + 42),
  (p_child_id, 'DTwP/DTaP 2',                 p_dob + 70),
  (p_child_id, 'IPV 2',                        p_dob + 70),
  (p_child_id, 'Hib 2',                        p_dob + 70),
  (p_child_id, 'Rotavirus 2',                  p_dob + 70),
  (p_child_id, 'PCV 2',                        p_dob + 70),
  (p_child_id, 'DTwP/DTaP 3',                 p_dob + 98),
  (p_child_id, 'IPV 3',                        p_dob + 98),
  (p_child_id, 'Hib 3',                        p_dob + 98),
  (p_child_id, 'Rotavirus 3',                  p_dob + 98),
  (p_child_id, 'PCV 3',                        p_dob + 98),
  (p_child_id, 'Hepatitis B 3',                p_dob + 180),
  (p_child_id, 'Influenza 1',                  p_dob + 180),
  (p_child_id, 'Measles / MMR 1',              p_dob + 270),
  (p_child_id, 'OPV 1',                        p_dob + 270),
  (p_child_id, 'Hepatitis A 1',                p_dob + 365),
  (p_child_id, 'Varicella 1',                  p_dob + 365),
  (p_child_id, 'MMR 2',                        p_dob + 455),
  (p_child_id, 'Varicella 2',                  p_dob + 455),
  (p_child_id, 'PCV booster',                  p_dob + 455),
  (p_child_id, 'DTwP/DTaP booster 1',         p_dob + 548),
  (p_child_id, 'Hib booster',                  p_dob + 548),
  (p_child_id, 'IPV booster',                  p_dob + 548),
  (p_child_id, 'Hepatitis A 2',                p_dob + 548),
  (p_child_id, 'Typhoid conjugate vaccine',    p_dob + 730),
  (p_child_id, 'DTwP/DTaP booster 2',         p_dob + 1825),
  (p_child_id, 'OPV booster 2',                p_dob + 1825),
  (p_child_id, 'MMR 3 (optional)',             p_dob + 1825),
  (p_child_id, 'Tdap',                         p_dob + 3650),
  (p_child_id, 'HPV 1 (girls)',                p_dob + 3650),
  (p_child_id, 'HPV 2 (girls)',                p_dob + 3740);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
