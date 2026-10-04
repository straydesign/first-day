-- Account deletion the user can trigger from the app (App Store 5.1.1(v)).
--
-- Deleting the auth.users row removes everything they own: goals,
-- plan_generations, public_rooms and reactions all reference auth.users with
-- ON DELETE CASCADE. Runs as the function owner so it can reach the auth
-- schema, and only ever deletes the caller.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
