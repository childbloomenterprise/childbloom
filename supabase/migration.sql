-- ChildBloom Database Schema
-- Run this in Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  language text default 'en',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. CHILDREN TABLE
-- ============================================
create table public.children (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  is_pregnant boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_children_user_id on public.children(user_id);

-- ============================================
-- 3. WEEKLY UPDATES TABLE
-- ============================================
create table public.weekly_updates (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references public.children on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  week_date date,
  age_in_days integer,
  weight_kg numeric(5,2),
  height_cm numeric(5,1),
  mood text,
  sleep_hours numeric(4,1),
  sleep_quality text,
  motor_milestone text,
  new_skills text,
  feeding_notes text,
  concerns text,
  ai_insight text,
  created_at timestamptz default now()
);

create index idx_weekly_updates_child_id on public.weekly_updates(child_id);

-- ============================================
-- 4. GROWTH RECORDS TABLE
-- ============================================
create table public.growth_records (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references public.children on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  weight_kg numeric(5,2),
  height_cm numeric(5,1),
  head_circumference_cm numeric(5,1),
  record_date date not null,
  notes text,
  created_at timestamptz default now()
);

create index idx_growth_records_child_id on public.growth_records(child_id);

-- ============================================
-- 5. FOOD LOGS TABLE
-- ============================================
create table public.food_logs (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references public.children on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  food_name text not null,
  meal_type text not null check (meal_type in ('breast_milk', 'formula', 'solid', 'snack')),
  quantity text,
  notes text,
  reaction text,
  log_date date not null default current_date,
  created_at timestamptz default now()
);

create index idx_food_logs_child_id on public.food_logs(child_id);

-- ============================================
-- 6. HEALTH RECORDS TABLE
-- ============================================
create table public.health_records (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references public.children on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  record_type text not null check (record_type in ('vaccination', 'checkup', 'illness', 'milestone')),
  title text not null,
  notes text,
  clinic_name text,
  record_date date not null,
  doctor_name text,
  next_due_date date,
  created_at timestamptz default now()
);

create index idx_health_records_child_id on public.health_records(child_id);

-- ============================================
-- 7. UPDATED_AT TRIGGER (auto-update timestamp)
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger set_children_updated_at
  before update on public.children
  for each row execute procedure public.update_updated_at();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.weekly_updates enable row level security;
alter table public.growth_records enable row level security;
alter table public.food_logs enable row level security;
alter table public.health_records enable row level security;

-- PROFILES: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- CHILDREN: users can CRUD their own children
create policy "Users can view own children"
  on public.children for select using (auth.uid() = user_id);
create policy "Users can insert own children"
  on public.children for insert with check (auth.uid() = user_id);
create policy "Users can update own children"
  on public.children for update using (auth.uid() = user_id);
create policy "Users can delete own children"
  on public.children for delete using (auth.uid() = user_id);

-- WEEKLY UPDATES: users can CRUD their own
create policy "Users can view own weekly updates"
  on public.weekly_updates for select using (auth.uid() = user_id);
create policy "Users can insert own weekly updates"
  on public.weekly_updates for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly updates"
  on public.weekly_updates for update using (auth.uid() = user_id);
create policy "Users can delete own weekly updates"
  on public.weekly_updates for delete using (auth.uid() = user_id);

-- GROWTH RECORDS: users can CRUD their own
create policy "Users can view own growth records"
  on public.growth_records for select using (auth.uid() = user_id);
create policy "Users can insert own growth records"
  on public.growth_records for insert with check (auth.uid() = user_id);
create policy "Users can update own growth records"
  on public.growth_records for update using (auth.uid() = user_id);
create policy "Users can delete own growth records"
  on public.growth_records for delete using (auth.uid() = user_id);

-- FOOD LOGS: users can CRUD their own
create policy "Users can view own food logs"
  on public.food_logs for select using (auth.uid() = user_id);
create policy "Users can insert own food logs"
  on public.food_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own food logs"
  on public.food_logs for update using (auth.uid() = user_id);
create policy "Users can delete own food logs"
  on public.food_logs for delete using (auth.uid() = user_id);

-- HEALTH RECORDS: users can CRUD their own
create policy "Users can view own health records"
  on public.health_records for select using (auth.uid() = user_id);
create policy "Users can insert own health records"
  on public.health_records for insert with check (auth.uid() = user_id);
create policy "Users can update own health records"
  on public.health_records for update using (auth.uid() = user_id);
create policy "Users can delete own health records"
  on public.health_records for delete using (auth.uid() = user_id);


-- ============================================
-- PATCH: Run this if tables already exist
-- (fixes existing Supabase databases)
-- ============================================
/*
-- Profiles: add missing language column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Weekly updates: add missing columns
ALTER TABLE public.weekly_updates
  ADD COLUMN IF NOT EXISTS week_date date,
  ADD COLUMN IF NOT EXISTS age_in_days integer,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric(4,1),
  ADD COLUMN IF NOT EXISTS motor_milestone text,
  ADD COLUMN IF NOT EXISTS new_skills text;

-- Food logs: rename column and add missing ones
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='food_logs' AND column_name='logged_date') THEN
    ALTER TABLE public.food_logs RENAME COLUMN logged_date TO log_date;
  END IF;
END $$;
ALTER TABLE public.food_logs ADD COLUMN IF NOT EXISTS reaction text;
ALTER TABLE public.food_logs DROP CONSTRAINT IF EXISTS food_logs_meal_type_check;
ALTER TABLE public.food_logs ADD CONSTRAINT food_logs_meal_type_check
  CHECK (meal_type IN ('breast_milk', 'formula', 'solid', 'snack'));

-- Health records: rename column and add missing ones
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='health_records' AND column_name='description') THEN
    ALTER TABLE public.health_records RENAME COLUMN description TO notes;
  END IF;
END $$;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS clinic_name text;
ALTER TABLE public.health_records DROP CONSTRAINT IF EXISTS health_records_record_type_check;
ALTER TABLE public.health_records ADD CONSTRAINT health_records_record_type_check
  CHECK (record_type IN ('vaccination', 'checkup', 'illness', 'milestone'));
*/
