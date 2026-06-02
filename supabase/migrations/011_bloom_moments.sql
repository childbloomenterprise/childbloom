-- 011_bloom_moments.sql
-- Bloom Path moments — parent's free-text notes about what they noticed
-- in their child's development. Powers the Bloom Path garden + timeline.

create table if not exists bloom_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,

  -- The note itself
  note text not null,
  area text,            -- 'body'|'voice'|'feelings'|'rest'|'nourishment'|
                        -- 'wonder'|'together'|'thinking'|null (unsure)

  -- When the parent says they noticed it (defaults to created_at)
  noticed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bloom_moments_child_noticed_idx
  on bloom_moments(child_id, noticed_at desc);

create index if not exists bloom_moments_child_area_idx
  on bloom_moments(child_id, area, noticed_at desc);

alter table bloom_moments enable row level security;

drop policy if exists "users read own bloom moments" on bloom_moments;
create policy "users read own bloom moments"
  on bloom_moments for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own bloom moments" on bloom_moments;
create policy "users insert own bloom moments"
  on bloom_moments for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own bloom moments" on bloom_moments;
create policy "users update own bloom moments"
  on bloom_moments for update
  using (auth.uid() = user_id);

drop policy if exists "users delete own bloom moments" on bloom_moments;
create policy "users delete own bloom moments"
  on bloom_moments for delete
  using (auth.uid() = user_id);
