-- Phase 2B — functions and triggers
--
-- Three pieces of infrastructure, none of which are an authentication
-- system on their own:
--   1. updated_at maintenance on vehicles/leads.
--   2. A profiles row is created automatically when someone signs up
--      through Supabase Auth — this only fires once auth is actually used
--      (Phase 2C+); it does nothing today because nothing signs up yet.
--   3. Two SECURITY DEFINER helper functions used by the RLS policies
--      migration, so admin-gate checks aren't repeated inline on every
--      policy and don't recurse when a `profiles` policy needs to read
--      `profiles` itself.

-- 1. updated_at maintenance --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- 2. profiles-on-signup --------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. RLS helper functions -------------------------------------------------
-- SECURITY DEFINER so the internal profiles lookup bypasses RLS — without
-- this, a policy on `profiles` calling a function that queries `profiles`
-- would recurse into its own RLS check.

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_active = true
  );
$$;

create or replace function public.current_user_role()
returns staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;
