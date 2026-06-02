-- 012_account_deletion.sql
-- Self-service account deletion.
--
-- Play Store policy 4.8 requires apps that support account creation
-- to also support account deletion from within the app. This function
-- lets a signed-in user delete their own auth.users row, which
-- cascades to all child_id / user_id rows via the FK chains we've set up.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'not_authenticated';
  end if;

  -- All user-owned tables cascade-delete via FK to auth.users(id),
  -- so deleting the auth row is sufficient. We don't try to enumerate
  -- the tables here — that's brittle.
  delete from auth.users where id = caller_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
