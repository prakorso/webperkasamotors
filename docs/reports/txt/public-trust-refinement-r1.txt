# Perkasa Motors - Public Trust Refinement R1: Hero CTA + About Trust Proof + Sold State + Footer CTA

**Result: OWNER AUTHORIZATION REQUIRED (one additive migration for About photos) + OWNER CONTENT REQUIRED (real About photos).** All four refinements are implemented and QA'd on a production build. Hero, SOLD and footer changes work immediately with no data change. The About photo feature is fully built but its table is a prepared, unapplied migration; until it is applied the public About renders copy-only exactly as today and the admin photo manager is visibly disabled. No live database or CMS write was made. Nothing merged or deployed.

Note: the four Owner screenshots referenced in the brief did not come through in this conversation; the work follows the written problem descriptions.

## A. Base verification
`git fetch origin --prune`: `origin/main` = `019c527b24b516ede0572f7c11badb4e9d4d35b4` (the verified production commit; unchanged at the end). Branch `feature/public-trust-refinement-r1`, worktree `.claude/worktrees/public-trust-refinement-r1`, created from exactly that SHA.

## B. Hero audit
Below 1280px the hero is image > content > CTAs (approved). The content block used `bg-ink` (#111315, near-black), and the secondary "Tanya via WhatsApp" was a borderless text-style action on mobile (measured on production at 390: `border 0px`, transparent background), so it blended into the dark block. The image ended on a hard edge into the black block.

## C. Hero refinement (tablet/mobile only)
- Surface: the content block and the slideshow wrapper use the existing `graphite` token (#232729, "deep neutral surface") below xl instead of `ink`; `ink` remains from xl, so the desktop overlay is unchanged.
- Secondary CTA: a real outlined secondary button below xl: 1px border at 55% paper, faint 7% paper fill, hover border 80% + fill 14%, full width on mobile (342px at 390, same width as the primary), auto width from md. The solid red primary remains dominant. From xl the exact original classes apply (transparent fill, 60% border).
- Transition: a restrained 48px tonal gradient at the bottom edge of the photo (to graphite at 70%) below xl only; no darkening of the photo itself.
- Desktop non-regression: computed styles at 1440 are identical to production (surface rgb(17,19,21); primary 191x52, 12px; secondary 289x52, transparent, 1px border at 60%); hero height 738px at 1440/1280; no copy, label, destination or carousel change.

## D. About product decision
The About section now does two jobs: say who Perkasa Motors is (existing CMS copy and 3 points, unchanged) and show visual proof that real transactions happen (new owner-managed real photos). It is proof imagery, separate from testimonials, with no requirement for captions and no automatic testimonial creation.

## E. About public layout
- With photos: copy and the 3 points on the left; a restrained editorial collage on the right (desktop) or below the copy (tablet/mobile). Composition by count (max 4 visible): 1 = one frame (16:10 below lg, 4:3 desktop); 2 = two portrait frames side by side; 3 = a wide main photo + 2 squares; 4 = a wide main photo + 3 squares. Not an equal grid, not a carousel. Crops centred slightly above middle (`object-[center_35%]`) to avoid clipping faces. Optional captions sit under photos, never over them. `next/image` with responsive `sizes`, lazy loading (below the fold), alt = caption or "Foto Perkasa Motors". Cap enforced twice (query limit 4 and in the component).
- Without photos (current live state, and whenever the table is not installed): the section renders exactly the existing copy-only layout; no empty frames or placeholders (verified on the homepage: 0 figures).
- Verified with stand-in images in a temporary local harness (deleted before commit, never shipped): 1/2/3/4 photos at 1440/1024/768/390/360: all images load, captions below photos, side-by-side on desktop, stacked on mobile, no overflow. At 390 with 4 photos the section is about 1100px tall (copy + points + a 342x214 main photo + three 106px squares).

## F. About CMS implementation
Website > Beranda: the existing "Tentang Perkasa Motors" text form is followed by a new "Foto / Bukti Perkasa" manager (no new top-level menu, Website tabs unchanged). Owner workflow: Tambah Foto (browser upload straight to storage, HEIC and size checks via the shared validator) > optional caption (saved on blur, 140 characters max) > Aktif on/off > up/down reorder > Hapus (confirm; removes the row and the file). It shows previews, the active count, and a note when more than 4 are active ("hanya 4 pertama yang tampil"). Upload failure after storage success rolls the file back. Until the table exists the manager shows "belum aktif di database" and its controls are disabled.

## G. About media architecture
Audit: buckets `article-media`, `content-thumbnails`, `site-assets`, `testimonials`, `vehicle-media` (all public-read, staff-write). Tables: `vehicle_media` is vehicle-scoped (would blur ownership), `testimonials` holds one optional avatar per quote, `website_settings` has a single About image field; none fits a sortable set of About photos. Decision: **reuse the existing `site-assets` bucket** for the files (site-level content; policies already public read + staff insert/update/delete; file names prefixed `about-proof-`) and **add one minimal table `homepage_about_media`** (id, storage_path, caption, sort_order, is_active, created_at, updated_at).

## H. Schema / storage requirements
- **Storage: none** (existing `site-assets` bucket and policies reused; no anonymous write; verified live read-only).
- **Schema: one additive migration, PREPARED, NOT APPLIED:** `supabase/migrations/20261003010000_homepage_about_media.sql`: create table with not-blank path and caption-length checks, sort index, `set_updated_at` trigger (existing function), RLS enabled, policies identical in shape to testimonials: public reads active rows only; staff (`is_active_staff()`) read all, insert, update, delete. No change to any existing object or data.
- Fail-safe code: public reader returns [] and admin reports schemaReady=false if the table is missing; actions return a clear Indonesian message.
- **OWNER AUTHORIZATION REQUIRED** before applying (shared production/staging Supabase). After authorization the AI applies it once and verifies; the Owner runs no SQL.

## I. SOLD card changes
Shared `VehicleCard`, so homepage Unit Terjual, /cars and /motorcycles all change together: SOLD cards have **no WhatsApp CTA** (no "Tanya Unit Lain", no replacement conversion action) and the small corner badge is replaced by a centred "TERJUAL" pill over the photo (translucent dark fill, light letter-spaced type, soft blur, light border; not red, not "Sold Out"). The existing muted image treatment is kept. The card still links to its detail page (factual archive). Verified: 4 SOLD on the homepage, 6 on /cars, 6 on /motorcycles, 0 with a WhatsApp CTA, marker centred within 2px at 1440 and 390.

## J. SOLD detail changes
SOLD detail: no WhatsApp CTA, no in-page decision area, no mobile sticky bar; the "Tanya Unit Lain" block now renders only for RESERVED; SOLD shows a quiet line "Unit ini sudah terjual." where the CTA was, plus the existing "Terjual" status badge. "Unit Lainnya" related AVAILABLE cards keep their unit-specific "Saya Tertarik" CTA (verified on a SOLD car and a SOLD motorcycle at 1440 and 390). AVAILABLE detail unchanged (decision area + sticky CTA, vehicle-specific message).

## K. RESERVED regression check
RESERVED behavior is intentionally unchanged: card keeps the "Dipesan" badge and the generic "Tanya Unit Lain" CTA; detail keeps the generic "Tanya Unit Lain" block. Code-verified (no live RESERVED unit exists).

## L. Footer WhatsApp refinement
The footer button now shows only the WhatsApp icon and "WhatsApp" (no visible number). Destination unchanged (wa.me/6285111307044, generic message); the number in settings is untouched. The screen-reader label keeps the number ("Chat lewat WhatsApp: ..."), since only the visible UI was to be simplified. Rest of the footer unchanged.

## M. Responsive QA - PASS
Production build. Public pages (home, /cars, /motorcycles, /articles, 4 detail pages) at 2560, 1440, 1280, 1024, 768, 430, 390, 360: 64/64 clean (no horizontal overflow, 0 duplicate ids, 0 missing alt, 0 broken images, 0 unnamed controls, 0 nested anchors, 0 page errors). Hero, both live slides at 1440/1280/1024/768/430/390/375/360: geometry identical to the approved hero (desktop 738px; tablet 1009x505 and 753x471 image blocks; mobile 3:2), 0 CTA or control overlap with the photo below xl. Test-harness note: the browser profile's extensions emit "runtime.lastError" messages on every web page (also on unrelated sites); those are excluded. Two transient error counts at 768/430 did not reproduce in 12 repeats of the same flow. A slide-2 frame captured empty once was a first-request image-optimizer delay (the image loads in about 0.5 s locally and on production).

## N. Vehicle QA - PASS
Homepage, /cars and /motorcycles SOLD cards: no WhatsApp, centred TERJUAL. SOLD car and SOLD motorcycle detail: no unit CTA, no sticky, "Unit ini sudah terjual.", related AVAILABLE CTA works. AVAILABLE car and motorcycle detail: CTA behavior unchanged. AVAILABLE cards: "Saya Tertarik" + "Tersedia" badge unchanged.

## O. CMS QA - PARTIAL (local / code-verified; migration not applied)
Not run against live data, by design. The manager was rendered in a local harness: list with previews, labelled caption inputs, 10 labelled reorder buttons for 5 items, over-limit note, enabled upload when ready; without a session, toggling Aktif returned "Anda harus masuk terlebih dahulu." and reverted, and reorder left the order unchanged; in the not-installed state the notice shows and upload is disabled. Real upload/save/delete can only be exercised live after the migration is authorized (and should use Owner-provided photos).

## P. Claim audit - PASS
Rendered pages: 0 occurrences of berkualitas, terjamin, terverifikasi, terinspeksi, kurasi, inspeksi, premium, warranty, garansi, guaranteed, kemewahan, "Sold Out". Trust comes from real photos, real sold history and clear status, not claims.

## Q. Technical validation - PASS
`npm ci`; `npm run lint` 0; `npx next typegen` + `npx tsc --noEmit` 0; `npm run build` PASS (26 routes, after removing the harness); `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: 1 high (existing dev-tooling `brace-expansion`; no fix run). Admin route redirects to login when signed out.

## R. Changed files
Modified: `app/(public)/page.tsx`, `app/(admin)/admin/(shell)/website/homepage/page.tsx`, `components/public/hero.tsx`, `components/public/hero-slideshow.tsx`, `components/public/homepage-about-section.tsx`, `components/public/site-footer.tsx`, `components/public/vehicle-card.tsx`, `components/public/vehicle-detail.tsx`, `lib/types/homepage-about.ts`. Added: `components/admin/homepage-about-media-manager.tsx`, `lib/actions/homepage-about-media.ts`, `lib/data/homepage-about-media.ts`, `supabase/migrations/20261003010000_homepage_about_media.sql`, plus this report, its TXT mirror and the Ruflo record.

## S. Live-write status
No live database write, no schema change, no CMS write, no storage write. Live access was read-only (bucket/policy/table listing, testimonial count). Observed during QA: 2 active testimonials now exist live (created 2026-10-02 15:59 UTC through the CMS) and already show on production; the homepage Testimoni section therefore renders (static row for fewer than 4). That is Owner content, not a change from this branch.

## T. Owner content requirements
- **ABOUT PHOTOS:** real Perkasa Motors photos (handovers, transactions, showroom moments), uploaded after the migration is authorized. No fake or stock imagery was used in the product.
- Optional captions per photo.

## U. Release readiness
Code is ready for Owner review and safe to merge as is (About photos stay dormant without the table). To enable About photos: authorize the migration, then the AI applies and verifies it, and the Owner uploads real photos in Website > Beranda.
