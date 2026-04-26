create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date not null default current_date,
  hours_slept numeric(4,1) not null check (hours_slept >= 0 and hours_slept <= 24),
  notes text,
  created_at timestamptz default now()
);

alter table sleep_logs enable row level security;

create policy "Users manage own sleep logs"
  on sleep_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index sleep_logs_child_date on sleep_logs(child_id, logged_date desc);
