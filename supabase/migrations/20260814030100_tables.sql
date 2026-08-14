-- Phase 2B — tables
--
-- Matches docs/PHASE-2-SUPABASE-PLAN.md section A field-for-field. Every
-- column traces to a field already read or written by lib/types/*.ts.

-- profiles ------------------------------------------------------------------
-- One row per auth.users row. Populated by a trigger on signup (see the
-- functions/triggers migration) — never inserted directly by app code.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  role staff_role not null default 'STAFF',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Admin console staff. auth.users mirror, one row per account, created by the on_auth_user_created trigger.';

-- vehicles --------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  stock_number text not null,
  slug text not null,
  vehicle_type vehicle_type not null,
  brand text not null,
  model text not null,
  variant text,
  year smallint not null,
  price bigint not null,
  currency text not null default 'IDR',
  mileage_km integer not null,
  transmission transmission not null,
  fuel_type fuel_type not null,
  exterior_color text,
  -- Showroom/lot name. Optional — single-location business today; see
  -- docs/PHASE-2-SUPABASE-PLAN.md section A for why the column exists anyway.
  location text,
  condition vehicle_condition not null,
  status vehicle_status not null default 'DRAFT',
  -- Distinct from `status` — see the plan doc's note on this split.
  is_published boolean not null default false,
  is_featured boolean not null default false,
  description text not null default '',
  highlights text[] not null default '{}',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint vehicles_stock_number_key unique (stock_number),
  constraint vehicles_slug_key unique (slug),
  constraint vehicles_currency_check check (currency = 'IDR')
);

comment on table public.vehicles is
  'Core inventory record. Public visibility requires is_published = true AND status in (AVAILABLE, RESERVED, SOLD) — see the RLS policy.';
comment on column public.vehicles.is_published is
  'Separate axis from status: a vehicle can be AVAILABLE internally while still withheld from the public site (e.g. pending photography).';

-- vehicle_media -----------------------------------------------------------
create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  media_type vehicle_media_type not null,
  -- Path within the vehicle-media storage bucket, not a raw URL.
  storage_path text not null,
  alt_text text not null default '',
  is_primary boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.vehicle_media is
  'Vehicle photography/video. storage_path resolves against the vehicle-media bucket.';

-- leads -----------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text,
  email text,
  message text not null,
  interested_vehicle_id uuid references public.vehicles (id) on delete set null,
  source lead_source not null,
  status lead_status not null default 'NEW',
  assigned_staff_id uuid references public.profiles (id) on delete set null,
  -- Internal staff notes — never shown to the submitter.
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is
  'Customer inquiries. Public write path is insert-only — see the RLS policy; no public read access.';

-- content -----------------------------------------------------------------
-- Instagram-sourced (and later, other editorial) content. The TypeScript
-- type keeps the name SocialContent to avoid an unrelated rename across
-- components; the table is named `content` per product vocabulary — see
-- docs/PHASE-2-SUPABASE-PLAN.md section A for the naming rationale.
create table public.content (
  id uuid primary key default gen_random_uuid(),
  -- Nullable by design: content does not have to reference a vehicle, and
  -- linking one never creates or mutates a vehicle row. See section B of
  -- the plan doc for the business rule this column exists to protect.
  vehicle_id uuid references public.vehicles (id) on delete set null,
  content_type content_type not null,
  status content_status not null default 'INBOX',
  caption text not null default '',
  permalink text not null,
  -- Mirrored copy in the content-thumbnails bucket — don't hotlink
  -- Instagram's CDN long-term.
  thumbnail_storage_path text,
  -- Ingestion idempotency key. UNIQUE with NULLs distinct (Postgres
  -- default) means multiple NULLs are allowed, but a given Instagram post
  -- can never be ingested twice.
  instagram_media_id text,
  posted_at timestamptz,
  classified_by uuid references public.profiles (id) on delete set null,
  classified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint content_instagram_media_id_key unique (instagram_media_id)
);

comment on table public.content is
  'Instagram/editorial content. vehicle_id is an optional link only — never a signal to create inventory. Not every post is a vehicle.';
