-- 026_backfill_user_profiles_parents.sql
-- One-time backfill: mirror every parent from profiles into user_profiles.
--
-- The profiles -> user_profiles sync trigger (sync_profile_to_user_profiles) only
-- fires on INSERT/UPDATE, so it had only synced 65 of 237 parents — the ones
-- touched since the trigger was created. Dr. Bloom reads the parent's display
-- name via children.user_profiles!parent_id, so for ~172 families it showed
-- "Unknown". This backfills the rest using the trigger's exact column mapping.
--
-- Safe + idempotent: only inserts parents not already present; never updates or
-- deletes; doctor rows (role='doctor') in user_profiles are untouched (doctors
-- are not in `profiles`). The trigger remains for ongoing sync until Stage 3
-- consolidates identity.
insert into public.user_profiles (id, email, full_name, role, avatar_url, created_at, updated_at)
select
  p.id,
  coalesce(nullif(trim(u.email), ''), p.id::text || '@noemail.local'),
  coalesce(nullif(trim(p.full_name), ''), coalesce(split_part(u.email, '@', 1), 'Parent')),
  'parent',
  p.avatar_url,
  p.created_at,
  coalesce(p.updated_at, now())
from public.profiles p
left join auth.users u on u.id = p.id
where not exists (select 1 from public.user_profiles up where up.id = p.id)
on conflict (id) do nothing;
