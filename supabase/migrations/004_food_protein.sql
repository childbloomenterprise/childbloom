-- Add protein tracking to food logs
ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS protein_g numeric(5,1);
