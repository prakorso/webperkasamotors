-- Public trust refinement R1: homepage About "proof" photos.
--
-- PREPARED, NOT APPLIED. Production and staging share one Supabase project,
-- so this migration is applied only after explicit Owner authorization.
-- The application works without it: the homepage renders the About copy
-- with no photo area, and the admin photo manager reports "migration
-- pending" and stays read-only.
--
-- Additive only: one new table, one index, one trigger, RLS + 5 policies.
-- No change to any existing table, policy, bucket or data.
-- The image FILES reuse the existing public site-assets bucket (public
-- read, staff-only insert/update/delete - already live), so no storage
-- change is needed. This table only stores which files are shown, their
-- order, an optional caption and an on/off flag.

create table public.homepage_about_media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_about_media_path_not_blank check (btrim(storage_path) <> ''),
  constraint homepage_about_media_caption_length check (caption is null or char_length(caption) <= 140)
);

comment on table public.homepage_about_media is
  'Real Perkasa Motors photos shown in the homepage About proof area (public display cap: 4). Files live in the site-assets bucket.';

create index homepage_about_media_sort_order_idx
  on public.homepage_about_media (sort_order, created_at);

create trigger homepage_about_media_set_updated_at
  before update on public.homepage_about_media
  for each row execute function public.set_updated_at();

alter table public.homepage_about_media enable row level security;

create policy "public can read active about media"
  on public.homepage_about_media for select
  to anon, authenticated
  using (is_active = true);

create policy "staff can read all about media"
  on public.homepage_about_media for select
  to authenticated
  using (public.is_active_staff());

create policy "staff can insert about media"
  on public.homepage_about_media for insert
  to authenticated
  with check (public.is_active_staff());

create policy "staff can update about media"
  on public.homepage_about_media for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "staff can delete about media"
  on public.homepage_about_media for delete
  to authenticated
  using (public.is_active_staff());
