-- Phase 2B — development seed
--
-- Mirrors lib/mock/vehicles.ts exactly: same 6 vehicles, same field values,
-- same is_published/status combination for each. No production vehicles
-- are invented here — this is fixture data for verifying the read path,
-- matching docs/PHASE-2-SUPABASE-PLAN.md section I.
--
-- Idempotent: safe to run more than once (ON CONFLICT on the unique slug
-- does nothing rather than erroring or duplicating).
--
-- Deliberately does NOT seed vehicle_media. Uploading the placeholder
-- images into the vehicle-media bucket requires an authenticated staff
-- session (the bucket's write policy is staff-only, by design — see
-- supabase/migrations/*_storage_buckets.sql), and no admin auth exists
-- yet. Vehicle cards/gallery already render correctly with zero media
-- (see components/public/vehicle-card.tsx and vehicle-gallery.tsx), so
-- this is a safe, honest gap — not a broken state — until a later phase
-- adds a real upload path.
--
-- location is intentionally left NULL on every row, same as
-- lib/mock/vehicles.ts — no real showroom-location data exists yet.

insert into public.vehicles (
  stock_number, slug, vehicle_type, brand, model, variant, year, price,
  currency, mileage_km, transmission, fuel_type, exterior_color, location,
  condition, status, is_published, is_featured, description, highlights,
  seo_title, seo_description
) values
  (
    'PM-0001', 'bmw-m4-competition', 'CAR', 'BMW', 'M4', 'Competition', 2024, 2850000000,
    'IDR', 4200, 'AUTOMATIC', 'PETROL', 'Isle of Man Green', null,
    'USED', 'AVAILABLE', true, true,
    'A one-owner M4 Competition finished in Isle of Man Green over a full merino leather interior. Full BMW service history, carbon ceramic brakes, and adaptive M suspension.',
    array['503 hp twin-turbo I6', '0–100 km/h in 3.8s', 'Carbon ceramic brakes'],
    'BMW M4 Competition (2024) — Perkasa Motors',
    '2024 BMW M4 Competition, 4,200 km, Isle of Man Green. Curated and inspected by Perkasa Motors.'
  ),
  (
    'PM-0002', 'mercedes-benz-c300', 'CAR', 'Mercedes-Benz', 'C300', 'AMG Line', 2023, 1150000000,
    'IDR', 9800, 'AUTOMATIC', 'PETROL', 'Obsidian Black', null,
    'USED', 'AVAILABLE', true, true,
    'C300 AMG Line with the Night Package and Burmester surround sound. Immaculate condition, dealer-maintained.',
    array['2.0L turbo, 258 hp', 'AMG Line exterior', 'Burmester sound system'],
    null, null
  ),
  (
    'PM-0003', 'porsche-911-carrera-s', 'CAR', 'Porsche', '911', 'Carrera S', 2022, 4200000000,
    'IDR', 8400, 'AUTOMATIC', 'PETROL', 'GT Silver Metallic', null,
    'USED', 'RESERVED', true, true,
    '992-generation Carrera S with PDK, Sport Chrono Package, and PASM sport suspension.',
    array['443 hp flat-six', 'PDK dual-clutch', 'Sport Chrono Package'],
    null, null
  ),
  (
    'PM-0004', 'toyota-alphard', 'CAR', 'Toyota', 'Alphard', '2.5 G', 2023, 980000000,
    'IDR', 12500, 'AUTOMATIC', 'PETROL', 'Pearl White', null,
    'USED', 'AVAILABLE', true, true,
    'Executive-spec Alphard with captain seats, rear entertainment, and full dealer records.',
    array['Captain seats', 'Rear entertainment', 'Full service records'],
    null, null
  ),
  (
    'PM-0005', 'ducati-panigale-v4-s', 'MOTORCYCLE', 'Ducati', 'Panigale', 'V4 S', 2024, 1150000000,
    'IDR', 1200, 'MANUAL', 'PETROL', 'Ducati Red', null,
    'USED', 'AVAILABLE', true, false,
    'Low-mileage Panigale V4 S with Öhlins electronic suspension and full Akrapovič exhaust.',
    array['214 hp V4', 'Öhlins electronic suspension', 'Akrapovič exhaust'],
    null, null
  ),
  (
    'PM-0006', 'bmw-r1250gs-adventure', 'MOTORCYCLE', 'BMW', 'R 1250 GS', 'Adventure', 2023, 720000000,
    'IDR', 12500, 'MANUAL', 'PETROL', 'Kalamata Metallic Matt', null,
    'USED', 'SOLD', true, false,
    'Fully-equipped GS Adventure with the touring and comfort packages, ready for long-distance riding.',
    array['136 hp boxer twin', 'Touring package', 'Adaptive cornering lights'],
    null, null
  )
on conflict (slug) do nothing;

-- Phase 2C Batch 2 — website_settings + navigation_items seed
--
-- Every value below is transplanted from what's currently hardcoded in
-- the frontend (app/layout.tsx, components/public/site-header.tsx,
-- components/public/site-footer.tsx, components/public/nav-links.tsx) —
-- nothing invented. Fields with no current hardcoded equivalent (phone,
-- whatsapp, email, address, social URLs, logo, favicon, OG image, default
-- CTA) are left null rather than filled with placeholder values.

insert into public.website_settings (
  id, company_name, footer_description, seo_title, seo_description, copyright_text
) values (
  1,
  'Perkasa Motors',
  'Premium automotive digital showroom. Presisi, Performa, Perkasa.',
  'Perkasa Motors — Premium Automotive Showroom',
  'Perkasa Motors is a curated premium automotive showroom — precision, performance, and Perkasa.',
  'All rights reserved.'
)
on conflict (id) do nothing;

-- HEADER — matches components/public/nav-links.tsx's PUBLIC_NAV_LINKS
-- exactly, plus the CTA button that was hardcoded separately in
-- site-header.tsx.
insert into public.navigation_items (placement, label, href, sort_order, is_cta) values
  ('HEADER', 'Beli Mobil', '/cars', 1, false),
  ('HEADER', 'Beli Motor', '/motorcycles', 2, false),
  ('HEADER', 'Tentang Kami', '/about', 3, false),
  ('HEADER', 'Simulasi Kredit', '/financing', 4, false),
  ('HEADER', 'Hubungi Kami', '/contact', 5, true)
on conflict (placement, label, href) do nothing;

-- FOOTER_NAV — matches site-footer.tsx's FOOTER_LINKS exactly, grouped
-- under the same "Navigasi" heading it already renders.
insert into public.navigation_items (placement, group_label, label, href, sort_order) values
  ('FOOTER_NAV', 'Navigasi', 'Tentang Kami', '/about', 1),
  ('FOOTER_NAV', 'Navigasi', 'Hubungi Kami', '/contact', 2),
  ('FOOTER_NAV', 'Navigasi', 'Simulasi Kredit', '/financing', 3),
  ('FOOTER_NAV', 'Navigasi', 'Articles', '/articles', 4)
on conflict (placement, label, href) do nothing;

-- No FOOTER_LEGAL rows: the current footer has no Privacy Policy / Terms
-- links today, and no such pages exist in the frontend yet. Seeding
-- placeholder legal links would add content that isn't actually there —
-- the table and admin UI support adding them the moment real pages exist.
