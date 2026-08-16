-- Phase 4 Batch 4.2 — Hero 3-slide structure.
--
-- Replaces the single hero_* columns on website_settings with three fixed,
-- explicit slide column groups (hero_1_*, hero_2_*, hero_3_*) — not a
-- generic/unbounded "hero_slides" table. This is a fixed 3-slot system by
-- design (see the admin UX: "Hero Slide 1/2/3", not an add/remove list),
-- and a one-person operation never needs more than that — a list table
-- would add drag-and-drop-reorder-shaped complexity (sort_order, RLS on a
-- new table, an admin list UI) for a cap the product deliberately never
-- exceeds.
--
-- DATA PRESERVATION: the live site_settings row (id=1) already has a real,
-- configured, active hero (eyebrow "Perkasa Motors Indonesia", headline
-- "Feel the Passion.\nExperience the Pride.", CTA "More Update") — this is
-- not a placeholder to discard. It is copied into hero_1_* below before
-- the old columns are dropped, so the public homepage's current live
-- appearance is unchanged by this migration: after it runs, Slide 1 alone
-- is active and Slides 2/3 are empty/inactive, which is exactly the same
-- "one static hero" render the old single-hero column produced.
--
-- The old hero_eyebrow/hero_headline/hero_description/
-- hero_image_storage_path/hero_cta_label/hero_cta_url/hero_is_active
-- columns are dropped, not left dangling unused — grepping the whole
-- repo confirmed exactly 6 files reference them (app/(public)/page.tsx,
-- components/admin/homepage-hero-form.tsx, lib/types/site-settings.ts,
-- lib/actions/site-settings.ts, lib/data/site-settings.ts, and this
-- migration's own predecessor), all owned and updated in this same
-- batch — keeping the old columns around unused would be exactly the
-- "mixed conventions" confusion this project has explicitly wanted to
-- avoid elsewhere (see the stock-number-prefix normalization batch).

alter table public.website_settings
  add column hero_1_image_storage_path text null,
  add column hero_1_eyebrow text null,
  add column hero_1_headline text null,
  add column hero_1_description text null,
  add column hero_1_cta_label text null,
  add column hero_1_cta_url text null,
  add column hero_1_is_active boolean not null default true,

  add column hero_2_image_storage_path text null,
  add column hero_2_eyebrow text null,
  add column hero_2_headline text null,
  add column hero_2_description text null,
  add column hero_2_cta_label text null,
  add column hero_2_cta_url text null,
  add column hero_2_is_active boolean not null default false,

  add column hero_3_image_storage_path text null,
  add column hero_3_eyebrow text null,
  add column hero_3_headline text null,
  add column hero_3_description text null,
  add column hero_3_cta_label text null,
  add column hero_3_cta_url text null,
  add column hero_3_is_active boolean not null default false;

comment on column public.website_settings.hero_1_image_storage_path is 'Path within the site-assets bucket for Hero Slide 1''s image. Null means no image for this slide.';
comment on column public.website_settings.hero_1_headline is 'Hero Slide 1 headline. A slide only participates in the public rotation if its own hero_N_is_active is true AND this is non-empty — see app/(public)/page.tsx.';
comment on column public.website_settings.hero_1_is_active is 'Per-slide active flag. All three slides inactive (or empty) falls back to the hardcoded DEFAULT_HERO — the homepage can never render broken/empty.';

-- Slide 2/3 columns share the same shape/meaning as Slide 1's — see the
-- comments above; not repeated per-column to keep this migration
-- readable.

-- Preserve the existing live hero content into Slide 1 before the old
-- columns disappear.
update public.website_settings
set
  hero_1_image_storage_path = hero_image_storage_path,
  hero_1_eyebrow = hero_eyebrow,
  hero_1_headline = hero_headline,
  hero_1_description = hero_description,
  hero_1_cta_label = hero_cta_label,
  hero_1_cta_url = hero_cta_url,
  hero_1_is_active = hero_is_active
where id = 1;

alter table public.website_settings
  drop column hero_eyebrow,
  drop column hero_headline,
  drop column hero_description,
  drop column hero_image_storage_path,
  drop column hero_cta_label,
  drop column hero_cta_url,
  drop column hero_is_active;
