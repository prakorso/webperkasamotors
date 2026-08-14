# Phase 2 — Supabase Implementation Plan

Status: **applied.** This schema is live on a dedicated Supabase project
("Perkasa Motors Website") as of Phase 2B — see `supabase/README.md` for
what's actually been run and `lib/data/vehicles.ts` for what's cut over to
it so far (the public vehicle read path only; admin functions and
leads/content are still mock, pending later phases). This document remains
the reference for *why* the schema looks the way it does; treat
`supabase/migrations/` as the source of truth for what's literally applied.

This plan is derived directly from the current codebase — `lib/types/*.ts`,
`lib/data/*.ts`, and `lib/mock/*.ts` — after the Phase 2A foundation pass
(see git history around this file's introduction). Every field below traces
back to something the frontend already reads or writes; nothing here is
speculative scope.

---

## A. Tables

### `vehicles`

The core inventory record. Maps 1:1 to `lib/types/vehicle.ts`'s `Vehicle`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk, default `gen_random_uuid()` | |
| `stock_number` | `text` unique not null | Dealer-facing identifier, e.g. `PM-0001` |
| `slug` | `text` unique not null | Public URL segment |
| `vehicle_type` | `vehicle_type` enum not null | `CAR` \| `MOTORCYCLE` |
| `brand` | `text` not null | |
| `model` | `text` not null | |
| `variant` | `text` null | |
| `year` | `smallint` not null | |
| `price` | `bigint` not null | IDR, no decimal subunit |
| `currency` | `text` not null default `'IDR'` | `check (currency = 'IDR')` — single-currency today, kept explicit rather than assumed |
| `mileage_km` | `integer` not null | |
| `transmission` | `transmission` enum not null | |
| `fuel_type` | `fuel_type` enum not null | |
| `exterior_color` | `text` null | |
| `location` | `text` null | Showroom/lot name. Optional — single-location business today; the column exists so a second location is a data entry, not a migration |
| `condition` | `vehicle_condition` enum not null | `NEW` \| `USED` |
| `status` | `vehicle_status` enum not null default `'DRAFT'` | Lifecycle: `DRAFT` \| `AVAILABLE` \| `RESERVED` \| `SOLD` \| `ARCHIVED` |
| `is_published` | `boolean` not null default `false` | **Separate axis from `status`** — see relationship note below |
| `is_featured` | `boolean` not null default `false` | Homepage featured-stock slot |
| `description` | `text` not null default `''` | |
| `highlights` | `text[]` not null default `'{}'` | Short marketing bullets shown as chips (e.g. "503 hp twin-turbo I6") — distinct from the structured spec fields above, which already cover "specifications" in the sense the current UI uses the word |
| `seo_title` | `text` null | |
| `seo_description` | `text` null | |
| `created_at` | `timestamptz` not null default `now()` | |
| `updated_at` | `timestamptz` not null default `now()` | Maintained by trigger |
| `created_by` | `uuid` null, fk → `profiles.id` | |

> **Why no separate `specifications` column:** the brief asked whether the
> inventory needs one. The current vehicle-detail page already renders a
> "specifications" section (`SPEC_ROWS` in `components/public/vehicle-detail.tsx`)
> built entirely from the typed columns above — year, mileage, transmission,
> fuel, color, condition. Adding a second freeform specs blob would duplicate
> that source of truth. If a genuinely unstructured spec (engine displacement,
> seat count, drivetrain) becomes necessary later, add it as a named column
> when a real page needs to render it — not as a speculative JSON bucket now.

> **`status` vs. `is_published`:** these were collapsed into one enum in
> Phase 1 (`DRAFT`/`ARCHIVED` doubled as "hidden"). Phase 2A split them
> because a dealership workflow genuinely has both axes — a car can be
> `AVAILABLE` (in stock, priced, ready to sell) while still `is_published =
> false` (photography not done, description not written). Public queries
> must require **both** conditions; see Section F.

### `vehicle_media`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `vehicle_id` | `uuid` not null, fk → `vehicles.id` on delete cascade | |
| `media_type` | `vehicle_media_type` enum not null | `EXTERIOR` \| `INTERIOR` \| `ENGINE` \| `WHEELS` \| `DOCUMENT` \| `VIDEO` \| `WALKAROUND` \| `OTHER` |
| `storage_path` | `text` not null | Path within the `vehicle-media` bucket, not a raw URL — see Section D |
| `alt_text` | `text` not null default `''` | |
| `is_primary` | `boolean` not null default `false` | |
| `sort_order` | `smallint` not null default `0` | |
| `created_at` | `timestamptz` not null default `now()` | |

Partial unique index guarantees one primary image per vehicle (Section C).

### `leads`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `customer_name` | `text` not null | |
| `phone` | `text` null | |
| `email` | `text` null | |
| `message` | `text` not null | |
| `interested_vehicle_id` | `uuid` null, fk → `vehicles.id` on delete set null | |
| `source` | `lead_source` enum not null | `WEBSITE` \| `INSTAGRAM` \| `WHATSAPP` \| `WALK_IN` \| `REFERRAL` \| `OTHER` |
| `status` | `lead_status` enum not null default `'NEW'` | 9 values, unchanged from `lib/types/lead.ts` |
| `assigned_staff_id` | `uuid` null, fk → `profiles.id` | |
| `notes` | `text` null | Internal staff notes — added in Phase 2A's type review, never shown to the submitter |
| `created_at` | `timestamptz` not null default `now()` | |
| `updated_at` | `timestamptz` not null default `now()` | |

### `content`

Instagram-sourced (and, later, other editorial) content. Maps to
`lib/types/social-content.ts`'s `SocialContent` — the TypeScript type keeps
its existing name (`SocialContent`) to avoid an unnecessary rename across
`components/public/vehicle-detail.tsx` and `social-content-strip.tsx`; the
table is named `content` per the product vocabulary, since it's intended to
eventually hold non-Instagram editorial items too (Section I, later phase).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk | |
| `vehicle_id` | `uuid` **null**, fk → `vehicles.id` on delete set null | Optional by design — see relationship rule below |
| `content_type` | `content_type` enum not null | `STOCK` \| `REVIEW` \| `REEL` \| `FEATURE` \| `NEWS` \| `OTHER` |
| `status` | `content_status` enum not null default `'INBOX'` | `INBOX` \| `CLASSIFIED` \| `PUBLISHED` \| `IGNORED` |
| `caption` | `text` not null default `''` | |
| `permalink` | `text` not null | Instagram permalink |
| `thumbnail_storage_path` | `text` null | Mirrored copy in the `content-thumbnails` bucket — don't hotlink Instagram's CDN long-term |
| `instagram_media_id` | `text` unique null | Ingestion idempotency key — prevents re-ingesting the same post twice |
| `posted_at` | `timestamptz` null | |
| `classified_by` | `uuid` null, fk → `profiles.id` | |
| `classified_at` | `timestamptz` null | |
| `created_at` | `timestamptz` not null default `now()` | |

### `profiles`

Backs Supabase Auth for the admin console. One row per `auth.users` row,
created by a trigger on signup — the standard Supabase pattern.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` pk, fk → `auth.users.id` on delete cascade | |
| `full_name` | `text` null | |
| `email` | `text` not null | Denormalized from `auth.users` for convenient joins/display |
| `role` | `staff_role` enum not null default `'STAFF'` | `OWNER` \| `ADMIN` \| `STAFF` — three tiers is already more than Phase 2 needs operationally, but costs nothing to define now and avoids an enum migration later |
| `is_active` | `boolean` not null default `true` | |
| `created_at` | `timestamptz` not null default `now()` | |

No other tables are proposed for Phase 2. `articles` and any
`*_status_history` audit tables are real future needs (the admin dashboard
already has a code comment naming the latter) but are out of scope until
the Content phase and an audit-trail requirement actually materialize.

---

## B. Relationships

```
profiles (1) ───< assigned_staff_id ─── (many) leads
profiles (1) ───< created_by         ─── (many) vehicles
profiles (1) ───< classified_by      ─── (many) content

vehicles (1) ───< vehicle_id (cascade) ─── (many) vehicle_media
vehicles (1) ───< interested_vehicle_id (set null) ─── (many) leads
vehicles (1) ───< vehicle_id (set null, NULLABLE) ─── (many) content
```

The one relationship that carries a business rule, not just referential
integrity: **`content.vehicle_id` is nullable and `on delete set null`, and
nothing in the schema — no trigger, no constraint — ever derives a row in
`vehicles` from a row in `content`.** Ingestion writes only to `content`.
Classifying or linking content is a human, in-place `UPDATE` on that same
row. A vehicle's availability lives exclusively in `vehicles.status` /
`vehicles.is_published`; `content` can be linked or unlinked freely without
ever touching either.

---

## C. Enums

```sql
create type vehicle_type      as enum ('CAR', 'MOTORCYCLE');
create type vehicle_status    as enum ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED');
create type vehicle_condition as enum ('NEW', 'USED');
create type transmission      as enum ('MANUAL', 'AUTOMATIC', 'CVT');
create type fuel_type         as enum ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC');
create type vehicle_media_type as enum ('EXTERIOR', 'INTERIOR', 'ENGINE', 'WHEELS', 'DOCUMENT', 'VIDEO', 'WALKAROUND', 'OTHER');

create type lead_source as enum ('WEBSITE', 'INSTAGRAM', 'WHATSAPP', 'WALK_IN', 'REFERRAL', 'OTHER');
create type lead_status as enum ('NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED', 'SOLD', 'LOST', 'SPAM');

create type content_type   as enum ('STOCK', 'REVIEW', 'REEL', 'FEATURE', 'NEWS', 'OTHER');
create type content_status as enum ('INBOX', 'CLASSIFIED', 'PUBLISHED', 'IGNORED');

create type staff_role as enum ('OWNER', 'ADMIN', 'STAFF');
```

All ported directly from the TypeScript unions already in `lib/types/` —
no enum value exists here that doesn't already exist in code today.

### Indexes

```sql
create unique index on vehicles (slug);
create unique index on vehicles (stock_number);
create index on vehicles (status);
create index on vehicles (vehicle_type);
create index on vehicles (is_featured) where is_featured = true;
create index on vehicles (created_at desc);

create index on vehicle_media (vehicle_id);
create unique index on vehicle_media (vehicle_id) where is_primary = true;

create index on leads (status);
create index on leads (interested_vehicle_id);
create index on leads (created_at desc);
create index on leads (assigned_staff_id);

create index on content (vehicle_id);
create index on content (status);
create index on content (content_type);
create unique index on content (instagram_media_id) where instagram_media_id is not null;
```

---

## D. Storage buckets

| Bucket | Access | Purpose |
|---|---|---|
| `vehicle-media` | Public read, authenticated (admin) write | Vehicle photography/video — `vehicle_media.storage_path` points here. Matches the upload UI already stubbed in `/admin/media`. |
| `content-thumbnails` | Public read, authenticated (admin/service) write | Mirrored Instagram thumbnails — `content.thumbnail_storage_path`. Mirroring rather than hotlinking avoids depending on Instagram's CDN availability/URL stability. |

Both buckets are public-read because vehicle photos and content thumbnails
are meant to be publicly visible on the site — no signed URLs needed for
these two. If staff-only assets are added later (e.g. internal documents),
that would be a separate, private bucket — not needed for Phase 2.

---

## E. Authentication model

- **Supabase Auth, email + password, admin console only.** No public
  customer accounts — nothing in the current frontend implies buyer login,
  wishlists, or saved searches (confirmed in the Phase 2 audit).
- Every `auth.users` row gets a matching `profiles` row via an
  `on auth.users insert` trigger.
- `/admin/*` currently has **no** auth check at all — `/admin/login` links
  straight through. The fix is:
  1. A `middleware.ts` (or route-group layout check) that reads the
     Supabase session and redirects unauthenticated requests to
     `/admin/login`.
  2. `/admin/login` submits real credentials instead of a static link.
  3. The `(admin)/admin/(shell)/layout.tsx` server component reads the
     session server-side to gate rendering, in addition to the middleware
     redirect (defense in depth — middleware can be bypassed by direct data
     fetches in some edge configurations, the layout check cannot).
- This is **not implemented in Phase 2A** per the instruction to prepare,
  not build, authentication. The route structure was reviewed and needs no
  restructuring for this to land later: every protected route already sits
  under the single `(admin)/admin/(shell)/layout.tsx`, which is exactly
  where a session check hooks in without moving any files.

---

## F. RLS requirements

RLS is the actual access boundary — the anon key is safe to expose because
of these policies, not despite them.

| Table | `anon` (public) | `authenticated` (admin) |
|---|---|---|
| `vehicles` | `select` where `is_published = true` and `status in ('AVAILABLE','RESERVED','SOLD')` | Full `select`/`insert`/`update`/`delete` — gated additionally by `profiles.is_active = true` |
| `vehicle_media` | `select` where the parent vehicle passes the same filter | Full CRUD, same admin gate |
| `leads` | `insert` only — no `select`, `update`, or `delete`. This is what lets the public Contact/Inquiry forms write without ever letting a visitor read other people's inquiries | Full CRUD, admin gate |
| `content` | `select` where `status = 'PUBLISHED'` and `vehicle_id` matches the vehicle being viewed | Full CRUD, admin gate |
| `profiles` | No access | `select` own row always; `select`/`update` others only for `role in ('OWNER','ADMIN')` |

The admin gate in every case is a policy like:

```sql
exists (
  select 1 from profiles
  where profiles.id = auth.uid() and profiles.is_active = true
)
```

No table should ever be fully open to `anon` for writes except `leads`
(insert-only), and no table should be fully open to `anon` for reads except
the already-filtered `vehicles` / `vehicle_media` / `content`.

---

## G. Frontend integration points

Directly from the Phase 2 audit, unchanged by Phase 2A (no frontend
integration happens yet — this section restates the plan for when it does):

| File | Change |
|---|---|
| `lib/data/vehicles.ts` | Swap `MOCK_VEHICLES` filtering for `supabase.from('vehicles')` queries. Every exported function signature stays identical — no importing page changes. |
| `lib/data/leads.ts` | Add a `createLead()` write function (currently read-only); wire `getAllLeadsForAdmin()` to Supabase. |
| `lib/data/social-content.ts` | Swap to `supabase.from('content')`. |
| `components/public/contact-form.tsx`, `inquiry-form.tsx` | Submit handler becomes a Server Action calling `createLead()`. Form markup unchanged. |
| `components/admin/vehicle-form.tsx` | Submit handler becomes a Server Action calling new `createVehicle()`/`updateVehicle()` functions in `lib/data/vehicles.ts`. |
| `app/(admin)/admin/(shell)/media/page.tsx` | Wire the existing drag-and-drop shell to Storage upload; already reads through `lib/data` as of Phase 2A. |
| New: `lib/supabase/server.ts` | Server-side Supabase client factory (anon key + RLS for most reads/writes; service role only where an admin action must bypass RLS). |
| New: `middleware.ts` | Session check protecting `/admin/*` (see Section E). |

Stays exactly as-is, no Supabase dependency ever: `Hero`, `SiteHeader`,
`SiteFooter`, `nav-links.tsx`, `SectionHeading`, everything in
`components/ui/`, and `FinancingCalculator` (pure client-side arithmetic).

Public listing/detail pages and admin list pages stay server components —
this is what makes ISR/SSG viable later and shouldn't change when the data
source does.

---

## H. Migration strategy from mock data

1. **Schema first, data second.** Apply the migration in Section A/C to a
   fresh Supabase project. Verify RLS (Section F) with a throwaway test
   session before any real data goes in.
2. **Seed from the mock fixtures, not by hand.** `lib/mock/vehicles.ts`,
   `lib/mock/leads.ts`, and `lib/mock/social-content.ts` are already valid,
   fully-typed records — write a one-off script that reads these arrays and
   inserts them via the Supabase JS client (service role, run once, not
   committed as app code). This guarantees the seeded data satisfies every
   constraint the schema declares, because it already satisfies the
   TypeScript types the schema was derived from.
3. **Media needs a real upload pass**, not a straight copy — the current
   mock media are locally-generated placeholder SVGs
   (`public/mock/vehicles/**/*.svg`), not real photography. Seeding
   `vehicle_media` rows can point at these temporarily (uploaded into the
   `vehicle-media` bucket as-is) so the UI keeps rendering identically
   during cutover, with real photography replacing them per-vehicle
   afterward — not a blocking step.
4. **Cut over one data-access module at a time**, in the order given in the
   accepted Phase 2 audit (vehicles read path → leads write path → auth →
   admin write paths → content). Each cutover is a single file's
   implementation swap; the calling pages don't change, so each step is
   independently testable and revertible.
5. **Keep `lib/mock/*.ts` in the repo** even after cutover, at least through
   the first full Phase 2 milestone. It's useful as fixture data for local
   development without a Supabase connection, and as the seed source in
   step 2 if a project ever needs to be rebuilt.

---

## I. Seed data strategy

- **Vehicles:** the 6 existing mock records are enough to validate the
  schema and exercise every status/type/condition combination already
  represented (`AVAILABLE`, `RESERVED`, `SOLD`; `CAR` and `MOTORCYCLE`;
  featured and not). No need to invent additional seed vehicles before
  real inventory is entered.
- **Leads:** the 4 mock records cover 4 of the 9 status values and 3 of
  the 6 sources — enough to prove the admin Leads table renders correctly.
  Real leads arrive as soon as the write path (Section G) ships; seed data
  should be deleted at that point, not left mixed with real submissions.
- **Content:** the 3 mock records are the minimum needed to prove the
  vehicle↔content link (linked-and-published, linked-and-published,
  unlinked-none-yet) — this is intentionally thin since real Instagram
  content is what should populate this table, not further invented
  fixtures.
- **Profiles:** seed exactly one `OWNER` profile for whoever first sets up
  the Supabase project, created through Supabase Auth's normal signup flow
  rather than inserted directly — this keeps the `auth.users` trigger path
  tested from day one instead of assumed to work.
- **Do not seed fictitious location data.** No current vehicle has a
  `location` value (Phase 2A left the mock records' `location` unset
  deliberately, since no real showroom-location data exists yet) — populate
  it only when it reflects an actual lot, not as a demo value.
