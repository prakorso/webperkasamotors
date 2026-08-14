-- Phase 2C Batch 2 — row level security
--
-- Reuses public.is_active_staff(), already defined in
-- 20260814030300_functions_and_triggers.sql.

alter table public.website_settings enable row level security;
alter table public.navigation_items enable row level security;

-- website_settings: public config, always readable; staff-only to change.
-- No insert/delete policy for anyone — the single row is created by this
-- migration's seed, never through the API.
create policy "public can read website settings"
  on public.website_settings for select
  to anon, authenticated
  using (true);

create policy "staff can update website settings"
  on public.website_settings for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- navigation_items
create policy "public can read visible navigation items"
  on public.navigation_items for select
  to anon, authenticated
  using (is_visible = true);

create policy "staff can read all navigation items"
  on public.navigation_items for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert navigation items"
  on public.navigation_items for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update navigation items"
  on public.navigation_items for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete navigation items"
  on public.navigation_items for delete
  to authenticated
  using (public.is_active_staff());
