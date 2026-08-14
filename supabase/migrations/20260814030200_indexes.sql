-- Phase 2B — indexes
--
-- vehicles.slug, vehicles.stock_number, and content.instagram_media_id
-- already have unique indexes from their UNIQUE constraints in the tables
-- migration, so they aren't repeated here. Everything below is additional,
-- matching docs/PHASE-2-SUPABASE-PLAN.md section C.

create index vehicles_status_idx on public.vehicles (status);
create index vehicles_vehicle_type_idx on public.vehicles (vehicle_type);
create index vehicles_featured_idx on public.vehicles (is_featured) where is_featured = true;
create index vehicles_created_at_idx on public.vehicles (created_at desc);

create index vehicle_media_vehicle_id_idx on public.vehicle_media (vehicle_id);
-- Enforces "at most one primary image per vehicle" at the database level.
create unique index vehicle_media_one_primary_idx
  on public.vehicle_media (vehicle_id) where is_primary = true;

create index leads_status_idx on public.leads (status);
create index leads_interested_vehicle_id_idx on public.leads (interested_vehicle_id);
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_assigned_staff_id_idx on public.leads (assigned_staff_id);

create index content_vehicle_id_idx on public.content (vehicle_id);
create index content_status_idx on public.content (status);
create index content_type_idx on public.content (content_type);
