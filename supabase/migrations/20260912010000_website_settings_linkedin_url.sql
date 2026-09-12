-- Adds LinkedIn as a fourth footer/general social link, alongside the
-- existing instagram_url/facebook_url/tiktok_url/youtube_url columns on
-- website_settings. Same column-per-platform convention already
-- established there — not a JSON/array column, to stay consistent with
-- how Instagram/Facebook/TikTok/YouTube are already modeled and read by
-- lib/data/site-settings.ts, lib/data/footer.ts, and both admin forms
-- (Website > General and Website > Footer, which already edit the same
-- underlying Social fieldset columns — see lib/actions/footer.ts's header
-- comment).
--
-- Purely additive: one nullable column, no existing column/row/policy
-- touched. RLS already covers this table generically (staff write,
-- public read of the singleton row), so no RLS change is needed.

alter table public.website_settings
  add column linkedin_url text null;

comment on column public.website_settings.linkedin_url is
  'LinkedIn company page URL. Same optional/nullable convention as instagram_url/facebook_url/tiktok_url/youtube_url — null or blank means the footer simply omits the LinkedIn icon.';
