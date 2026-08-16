-- Phase 4 Batches 4.4/4.5 — Why Perkasa section header + Testimonials
-- photo storage.
--
-- Why Perkasa: the benefit CARDS already have a table
-- (homepage_benefits, from 20260815040000_homepage_cms.sql) — genuinely
-- a one-to-many list, so it correctly got its own table back then. What
-- was never added is the section's own singleton header (eyebrow/
-- headline/description/active), which — like Hero and About — belongs
-- on website_settings, not a new table. Same reasoning, same pattern.
--
-- No migration needed for homepage_benefits or testimonials themselves —
-- both already have exactly the columns this batch needs
-- (title/description/icon/sort_order/is_active and
-- customer_name/testimonial/role_label/photo_storage_path/sort_order/
-- is_active respectively), with RLS already correctly scoped (public
-- reads active rows, staff has full CRUD). Confirmed by inspection
-- before writing this migration — not assumed.
--
-- Testimonials photos need a bucket: they're per-row images tied to an
-- arbitrary testimonial, not a vehicle (vehicle-media) and not a
-- singleton brand/section asset (site-assets) — a new small
-- purpose-specific bucket matches the existing one-bucket-per-domain
-- precedent (vehicle-media, content-thumbnails, site-assets) rather than
-- overloading an unrelated bucket.

alter table public.website_settings
  add column why_perkasa_eyebrow text null,
  add column why_perkasa_headline text null,
  add column why_perkasa_description text null,
  add column why_perkasa_is_active boolean not null default true;

comment on column public.website_settings.why_perkasa_headline is 'Why Perkasa section headline. Required (enforced in updateWhyPerkasaSection) whenever why_perkasa_is_active is true. If inactive or empty, the homepage falls back to the hardcoded DEFAULT_WHY_PERKASA (components/public/why-perkasa-section.tsx) — same fallback shape as Hero''s DEFAULT_HERO, since the current 3-benefit copy is generic evergreen marketing content, not something that goes stale.';
comment on column public.website_settings.why_perkasa_is_active is 'Per-section active flag, same semantics as hero_1_is_active/about_is_active.';

insert into storage.buckets (id, name, public)
values ('testimonials', 'testimonials', true)
on conflict (id) do nothing;

create policy "public can read testimonial photo objects"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'testimonials');

create policy "staff can upload testimonial photo objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'testimonials' and public.is_active_staff());

create policy "staff can update testimonial photo objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'testimonials' and public.is_active_staff())
  with check (bucket_id = 'testimonials' and public.is_active_staff());

create policy "staff can delete testimonial photo objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'testimonials' and public.is_active_staff());
