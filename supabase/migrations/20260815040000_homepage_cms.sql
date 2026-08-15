-- Phase 4 Batch 1 — Homepage CMS schema.
--
-- Hero + About are singleton content (exactly one of each), same
-- cardinality and staff-write/public-read permission model as everything
-- else already on website_settings — extended there rather than a new
-- table, per the approved architecture.
--
-- homepage_benefits ("Why Perkasa") and testimonials are genuine
-- one-to-many lists, so they get their own small tables, matching the
-- existing list-table pattern (navigation_items, vehicle_media, content) —
-- not a generic/polymorphic "blocks" table.
--
-- This migration is schema only. Their application/admin UI is a later
-- Phase 4 batch — only Hero's application layer ships in this batch.
-- No changes to vehicles, vehicle_media, leads, content, navigation_items,
-- or any existing table's columns/policies.

-- Hero fields on website_settings ------------------------------------------

alter table public.website_settings
  add column hero_eyebrow text null,
  add column hero_headline text null,
  add column hero_description text null,
  add column hero_image_storage_path text null,
  add column hero_cta_label text null,
  add column hero_cta_url text null,
  add column hero_is_active boolean not null default true;

comment on column public.website_settings.hero_eyebrow is
  'Homepage hero eyebrow label.';
comment on column public.website_settings.hero_headline is
  'Homepage hero headline. Empty/null means the public homepage falls back to the hardcoded default hero.';
comment on column public.website_settings.hero_description is
  'Homepage hero supporting description text.';
comment on column public.website_settings.hero_image_storage_path is
  'Path within the existing site-assets bucket — no new bucket. Null means no hero image; the homepage must not render a broken image.';
comment on column public.website_settings.hero_cta_label is
  'Homepage hero CTA button label.';
comment on column public.website_settings.hero_cta_url is
  'Homepage hero CTA destination — internal (e.g. /cars) or external URL.';
comment on column public.website_settings.hero_is_active is
  'When false, the public homepage falls back to the hardcoded default hero regardless of the other hero_* values.';

-- homepage_benefits ("Why Perkasa") — schema only this batch --------------

create table public.homepage_benefits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon text null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.homepage_benefits is
  'Homepage "Why Perkasa" benefit cards. Schema only in Phase 4 Batch 1 — admin/public UI lands in a later batch.';

alter table public.homepage_benefits enable row level security;

create policy "public can read active homepage benefits"
  on public.homepage_benefits for select
  to anon, authenticated
  using (is_active = true);

create policy "staff can read all homepage benefits"
  on public.homepage_benefits for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert homepage benefits"
  on public.homepage_benefits for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update homepage benefits"
  on public.homepage_benefits for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete homepage benefits"
  on public.homepage_benefits for delete
  to authenticated
  using (public.is_active_staff());

create index homepage_benefits_sort_order_idx on public.homepage_benefits (sort_order);

-- testimonials — schema only this batch ------------------------------------

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  testimonial text not null,
  role_label text null,
  photo_storage_path text null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.testimonials is
  'Homepage customer testimonials. Schema only in Phase 4 Batch 1 — admin/public UI lands in a later batch.';

alter table public.testimonials enable row level security;

create policy "public can read active testimonials"
  on public.testimonials for select
  to anon, authenticated
  using (is_active = true);

create policy "staff can read all testimonials"
  on public.testimonials for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert testimonials"
  on public.testimonials for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update testimonials"
  on public.testimonials for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete testimonials"
  on public.testimonials for delete
  to authenticated
  using (public.is_active_staff());

create index testimonials_sort_order_idx on public.testimonials (sort_order);
