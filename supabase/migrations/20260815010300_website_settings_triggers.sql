-- Phase 2C Batch 2 — updated_at maintenance
--
-- Reuses public.set_updated_at(), already defined in
-- 20260814030300_functions_and_triggers.sql — no new function needed.

create trigger website_settings_set_updated_at
  before update on public.website_settings
  for each row execute function public.set_updated_at();

create trigger navigation_items_set_updated_at
  before update on public.navigation_items
  for each row execute function public.set_updated_at();
