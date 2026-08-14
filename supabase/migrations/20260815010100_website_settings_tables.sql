-- Phase 2C Batch 2 — Website Settings / Navigation tables
--
-- website_settings: singleton config row (Brand/Contact/Social/SEO/General).
-- Enforced as exactly one row via `id smallint primary key default 1` plus
-- a check constraint — the classic Postgres singleton-table pattern.
--
-- navigation_items: serves BOTH the header nav and the footer (nav groups
-- + legal links), distinguished by `placement`. Header Nav Manager and
-- Footer Manager are both just "add/edit/hide/show/reorder a link" —
-- building two near-identical tables for that would be exactly the
-- duplication the brief warns against.

create table public.website_settings (
  id smallint primary key default 1,
  constraint website_settings_singleton check (id = 1),

  -- Brand
  company_name text not null default 'Perkasa Motors',
  tagline text,
  logo_storage_path text,
  favicon_storage_path text,

  -- Contact
  phone text,
  whatsapp text,
  email text,
  address text,

  -- Social
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  youtube_url text,

  -- SEO
  seo_title text,
  seo_description text,
  seo_og_image_storage_path text,

  -- General
  default_cta_label text,
  default_cta_url text,
  copyright_text text not null default 'All rights reserved.',

  -- Footer company block (distinct from the short brand `tagline` — this
  -- is the longer descriptive line under the footer's company name)
  footer_description text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on table public.website_settings is
  'Singleton site-wide configuration (branding, contact, social, SEO, general). Exactly one row, id = 1.';

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  placement nav_placement not null,
  -- Footer nav groups only (e.g. "Navigasi"). Null for HEADER and
  -- FOOTER_LEGAL, where items aren't grouped under a heading.
  group_label text,
  label text not null,
  href text not null,
  sort_order smallint not null default 0,
  is_visible boolean not null default true,
  is_external boolean not null default false,
  -- Header-only in practice (renders as the styled CTA button instead of
  -- a plain link) but harmless on other placements.
  is_cta boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

comment on table public.navigation_items is
  'Header nav, footer nav groups, and footer legal links — one table, distinguished by placement. Public reads filter to is_visible = true.';
