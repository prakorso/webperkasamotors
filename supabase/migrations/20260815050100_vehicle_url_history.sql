-- Inventory automation — slug/URL history for redirects.
--
-- Tracks (vehicle_type, slug) pairs, not just slug alone: a vehicle can
-- keep the same slug but move catalogue path if its type changes, so
-- what needs preserving is the whole old URL, not just the old text
-- fragment. Public-read: resolving a stale URL to its current one must
-- work for anonymous visitors, and an old public URL was never
-- sensitive data.

create table public.vehicle_url_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  vehicle_type vehicle_type not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (vehicle_type, slug)
);

comment on table public.vehicle_url_history is
  'Every previous (vehicle_type, slug) a vehicle has had. Populated by updateVehicle when brand/model/variant/year change enough to regenerate the slug, or when vehicle_type changes — read by the public /cars/[slug] and /motorcycles/[slug] routes to 308-redirect stale URLs to the vehicle''s current one.';

create index vehicle_url_history_vehicle_id_idx on public.vehicle_url_history (vehicle_id);

alter table public.vehicle_url_history enable row level security;

create policy "public can read vehicle url history"
  on public.vehicle_url_history for select
  to anon, authenticated
  using (true);

create policy "staff can insert vehicle url history"
  on public.vehicle_url_history for insert
  to authenticated
  with check (public.is_active_staff());
