-- Parent mood check-in (independent of weekly_updates)
CREATE TABLE IF NOT EXISTS public.parent_moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  mood text NOT NULL CHECK (mood IN ('tired','good','anxious','strong','happy','worried','calm')),
  note text,
  mood_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_moods_user_date_unique
  ON public.parent_moods (user_id, mood_date);

CREATE INDEX IF NOT EXISTS parent_moods_user_created_idx
  ON public.parent_moods (user_id, created_at DESC);

ALTER TABLE public.parent_moods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_moods_select_own" ON public.parent_moods;
CREATE POLICY "parent_moods_select_own" ON public.parent_moods
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "parent_moods_insert_own" ON public.parent_moods;
CREATE POLICY "parent_moods_insert_own" ON public.parent_moods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "parent_moods_update_own" ON public.parent_moods;
CREATE POLICY "parent_moods_update_own" ON public.parent_moods
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "parent_moods_delete_own" ON public.parent_moods;
CREATE POLICY "parent_moods_delete_own" ON public.parent_moods
  FOR DELETE USING (auth.uid() = user_id);
