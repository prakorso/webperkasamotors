-- Phase 2B follow-up — close the function_search_path_mutable advisory on
-- set_updated_at. Pure hardening: pins search_path exactly like the other
-- three functions already have. No behavior change.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user is a trigger function only, never meant to be called
-- directly via RPC. Triggers fire regardless of this grant (the trigger
-- mechanism doesn't go through the same EXECUTE check as an RPC call), so
-- revoking public/anon/authenticated EXECUTE here closes the advisory
-- without touching how the trigger itself fires.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
