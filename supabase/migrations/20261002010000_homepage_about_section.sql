-- Post-release simplification R1: homepage "Tentang Perkasa Motors" block.
--
-- PREPARED, NOT APPLIED. Production and staging share one Supabase project,
-- so this migration is applied only after explicit Owner authorization.
-- The application works without it: the homepage falls back to code-owned
-- default copy and the admin editor reports "migration pending" instead of
-- saving. Applying it only enables owner editing of that copy.
--
-- Additive only: 7 nullable/defaulted columns on the existing singleton
-- website_settings row. No drop, rename, rewrite or data change. The legacy
-- about_* columns (old standalone About block) are left untouched and stay
-- dormant. Existing website_settings RLS applies unchanged (public read,
-- staff write).

alter table public.website_settings
  add column if not exists homepage_about_eyebrow text null,
  add column if not exists homepage_about_title text null,
  add column if not exists homepage_about_description text null,
  add column if not exists homepage_about_point_1 text null,
  add column if not exists homepage_about_point_2 text null,
  add column if not exists homepage_about_point_3 text null,
  add column if not exists homepage_about_is_active boolean not null default true;

comment on column public.website_settings.homepage_about_title is
  'Homepage "Tentang Perkasa Motors" headline. NULL = use the code default.';
comment on column public.website_settings.homepage_about_description is
  'Homepage About short description. NULL = use the code default.';
comment on column public.website_settings.homepage_about_point_1 is
  'Homepage About factual trust point 1 (short line). NULL = code default.';
comment on column public.website_settings.homepage_about_is_active is
  'false hides the homepage About block entirely.';
