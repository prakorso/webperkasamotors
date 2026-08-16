-- Phase 4 Batch 4.3 — About / Tentang Perkasa homepage section.
--
-- Singleton content on website_settings, same cardinality/permission
-- model as everything else there (staff write, public read) — not a new
-- table. This was actually the original plan (see this migration's
-- predecessor's header comment: "Hero + About are singleton content...
-- extended there rather than a new table"), just never implemented until
-- now.
--
-- No data preservation step needed here, unlike the Hero 3-slide
-- migration: no about_* columns or homepage About section existed
-- before this migration, so there is nothing to migrate — every column
-- starts null/inactive-by-content (about_is_active defaults true, but
-- the actual public render guard requires a non-empty headline AND
-- description too, so an unconfigured row never renders anything).

alter table public.website_settings
  add column about_image_storage_path text null,
  add column about_eyebrow text null,
  add column about_headline text null,
  add column about_description text null,
  add column about_cta_label text null,
  add column about_cta_url text null,
  add column about_is_active boolean not null default true;

comment on column public.website_settings.about_image_storage_path is 'Path within the site-assets bucket for the About section image. Null means no image — the section renders as a centered text block instead (see components/public/about-section.tsx).';
comment on column public.website_settings.about_headline is 'About section headline. Required (enforced in updateAboutSection) whenever about_is_active is true — the section never renders active-but-empty.';
comment on column public.website_settings.about_description is 'About section body copy. Same required-when-active rule as headline.';
comment on column public.website_settings.about_is_active is 'When false, or when headline/description are empty, the homepage simply omits the About section — there is no hardcoded homepage About copy to fall back to (unlike Hero''s DEFAULT_HERO), so "not configured" means "not shown", not "broken".';
