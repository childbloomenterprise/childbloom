-- 008_medical_bills.sql
-- Stores OCR-scanned medical bills (api/scan-bill.js, api/generate-summary.js).

create table if not exists medical_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid references children(id) on delete set null,
  image_url text,
  extracted_text text,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists medical_bills_user_idx on medical_bills (user_id, created_at desc);
create index if not exists medical_bills_child_idx on medical_bills (child_id, created_at desc);

alter table medical_bills enable row level security;

drop policy if exists "users can read own bills" on medical_bills;
create policy "users can read own bills"
  on medical_bills for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own bills" on medical_bills;
create policy "users can insert own bills"
  on medical_bills for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own bills" on medical_bills;
create policy "users can update own bills"
  on medical_bills for update
  using (auth.uid() = user_id);

drop policy if exists "users can delete own bills" on medical_bills;
create policy "users can delete own bills"
  on medical_bills for delete
  using (auth.uid() = user_id);
