# Perkasa Motors - Phase 2R.5: Admin / CMS Simplification

Result: **PASS with limits**. Task state ACTIVE -> REVIEW. Not merged, not deployed. Database mode READ ONLY: no migrations, no CMS or Supabase writes. **Admin screens were not browser-tested while signed in** (see X). The CMS content patch is prepared, NOT executed.

## A. Base verification
Branch `integration/phase-2r5-admin-cms-simplification` from the pushed head of `integration/phase-2r4-public-product-spec`: `665a8a623a50a25abe23a80366eba0291efcd927` (local and origin matched). Worktree `C:\Users\USER\webperkasamotors\.claude\worktrees\phase-2r5-admin-cms-simplification`. All governance, audit and phase reports were present. `.env.local` copied locally, gitignored, not committed.

## B. Admin before/after map
| Area | Before | After |
|---|---|---|
| Sidebar | Dashboard, Inventory, Leads, Content, Articles, Website, Settings | Ringkasan, Inventory, Website, Artikel |
| Dashboard | stat cards incl. New Leads/Total, fake "Recent Activity", "mock" wording | Tersedia / Dipesan / Terjual counts, Perlu Dilengkapi, Terakhir Diubah, Tambah Unit, Lihat Situs |
| Inventory | wide table, English, Edit/Delete only | status tabs with counts, row-cards with status buttons and inline price edit |
| Vehicle form | 3 fieldsets, Published + Featured checkboxes, status select, defaults (price 0, Automatic, Petrol, current year, Car) | 5 numbered owner sections, no technical controls, no silent defaults |
| Website | General / Header & Navigation / Footer / Homepage / About | Beranda / Tentang / Kontak & WhatsApp / Lanjutan |
| Homepage admin | Hero, About, Why Perkasa, Testimonials, Social Content note | Hero only + list of what is automatic |
| About admin | editable CMS sections with zero public effect | honest read-only explanation, no form |
| Articles admin | slug, excerpt, category, tags, SEO always visible | Title, Body, Status visible; the rest under "Lanjutan (opsional)" |
| Topbar | non-working search box and bell | removed |

## C. Navigation simplification
`components/admin/nav-items.tsx` now has exactly four items. Leads, Content and Settings are no longer linked anywhere; Media stays absent. Routes `/admin/leads`, `/admin/content`, `/admin/settings`, `/admin/media` still exist (nothing deleted). Old `/admin/website/navigation` and `/admin/website/footer` redirect to `/admin/website/advanced`.

## D. Dashboard simplification
Counts per status link to the matching Inventory tab. "Perlu Dilengkapi" flags: no photo, price <= 0, used with kilometer <= 0, public status but not live (legacy flag mismatch), Draft older than 14 days (uses `created_at` through the new admin-only `getVehicleActivityForAdmin`). "Terakhir Diubah" = 5 most recently updated units. No leads, no status history, no fake activity.

## E. Inventory operating model
`/admin/inventory?status=semua|tersedia|dipesan|terjual|lainnya` (tabs inside one route, with counts; "lainnya" = Draft/Arsip). Each unit is a stacked row-card (no wide table, so narrow screens do not need horizontal scroll) with status badge, "Tayang/Belum tayang di situs", price, status buttons, Edit, Hapus. Hard delete keeps the SOLD/RESERVED lock (UI and database trigger unchanged).

## F. Quick status actions
New server action `setVehicleStatus(id, status)` in `lib/actions/vehicles.ts`; shared UI `vehicle-status-actions.tsx` used in the list and on the unit page.
Allowed owner moves (server-enforced `ALLOWED_TRANSITIONS`): DRAFT -> AVAILABLE ("Tayangkan"); AVAILABLE -> RESERVED, SOLD, DRAFT; RESERVED -> AVAILABLE ("Tersedia Lagi"), SOLD; ARCHIVED -> DRAFT, AVAILABLE; **SOLD -> nothing**. SOLD is final from the UI on purpose: returning it to AVAILABLE would make it deletable and let its permanently-reserved stock number be reused. Note the same hazard exists for the requested RESERVED -> AVAILABLE move (deletable afterwards); accepted because it was requested, flagged for the owner. Leaving a non-public state for a public one requires at least one photo. Marking SOLD asks for confirmation. Two interactions from the list (one tap, one confirm for SOLD). Status enum is validated server-side; ARCHIVED only through `archiveVehicle`.
Verification: type-checked, linted, built. **Live mutation NOT VERIFIED** (no safe test record; no data may be mutated, and no signed-in session).

## G. Quick price action
`setVehiclePrice(id, price)`: server checks finite, integer, > 0, writes only `price`, revalidates. Inline "Ubah" -> input -> Simpan on each row. Live use NOT VERIFIED (same reason).

## H. Vehicle-create simplification
Order: 1 Jenis kendaraan, 2 Informasi unit (merek, model, varian, tahun), 3 Harga, 4 Spesifikasi, 5 Highlights, then "Simpan & Lanjut ke Foto". New units are always created as private DRAFT (`is_published=false`, condition USED); photos are added on the next screen and "Tayangkan" publishes (photo required). Required and now start empty: jenis, tahun, harga, kilometer, transmisi, bahan bakar (selects have a disabled placeholder; server also validates enums and integer mileage). Slug, stock number, SEO, alt text are automatic.

## I. Vehicle-edit simplification
Unit page = status panel (badge, live note, status buttons) + the same form + photos. Status and visibility are no longer in the form. Social Content editor removed from this page.

## J. Vehicle field classification
| Field | Class |
|---|---|
| vehicle type, brand, model, year, price, mileage, transmission, fuel | owner, required |
| variant, color, plate, highlights, capacity CC (motorcycles, or when a value exists) | owner, optional |
| stock number | system, shown as small text |
| slug, SEO title/description, canonical, OG, alt text | system |
| condition | system (defaults USED on create; untouched on edit) |
| location | system (not asked; untouched) |
| description | legacy, hidden (round-trips untouched) |
| is_published | derived from status by `setVehicleStatus`; never an owner decision |
| is_featured | removed from workflow; column kept (homepage uses latest AVAILABLE) |

Compatibility: `VehicleInput` fields other than the business facts are optional and omitted fields are NOT written, so saving the form cannot overwrite `status`, `is_published`, `is_featured`, description or SEO changed elsewhere. Legacy rows whose `is_published` disagrees with their status are flagged "Belum tayang di situs" and fixed by the "Tayangkan" button (re-sync). Saving the form never changes publication.

## K. Media/photos behavior
Unchanged: multi-upload, cover star, ordering, preview, first upload becomes cover; photos stay inside the unit page; no standalone Media menu. HEIC messaging and drag-reorder deferred (messaging not changed this phase).

## L. Website CMS grouping
Top-level Website with sub-tabs Beranda, Tentang, Kontak & WhatsApp (default), Lanjutan; subnav scrolls horizontally on small screens.

## M. Homepage admin reconciliation
Beranda shows the hero editor and a note on what is automatic. Removed from the screen: About, Why Perkasa, Testimonials editors and the Social Content note (which falsely said the homepage showed social content). Deleted components: `homepage-about-form`, `homepage-why-perkasa-form`, `homepage-testimonials-form`. Dormant backend kept: actions (`updateAboutSection`, `updateWhyPerkasaSection`, `homepage-benefits`, `testimonials`), data readers, types and all tables/rows (LEGACY / DORMANT).

## N. About CMS reconciliation
Chosen: **OPTION C**. The CMS model (`about_page_sections`, keys `hero` and `story`) cannot be mapped to the four code-driven blocks without either rendering the legacy unsupported text or writing data. Tentang now explains where each public block comes from and links to Kontak & WhatsApp for address/phone. No form that appears functional. `about-page-form.tsx` deleted; `lib/actions/about-page.ts` and the table remain dormant.

## O. How-to-Buy ownership decision
Stays **code-owned** (`components/public/how-to-buy-section.tsx`). Four rarely-changing lines; no new table. Owner must still confirm the steps (OWNER_FACT_REQUIRED).

## P. Contact/WhatsApp source-of-truth audit
Verified from `lib/actions/site-settings.ts` and `lib/actions/footer.ts`: the old General form and the old Footer form wrote the **same** `website_settings` columns (phone, whatsapp, email, address, instagram/facebook/tiktok/youtube/linkedin URLs, copyright_text). So this was duplicated editing of one source, not two data sources; the UI was collapsed safely and existing values are preserved. New `updateContactSettings` (company name, phone, whatsapp, email, address, five social URLs, two WhatsApp templates) with server validation (company name required, WhatsApp must normalize to an Indonesian mobile number, social URLs must be http/https). Social channels: only configured ones are shown, others via "+ Tambah". Live values currently: WhatsApp +62 851-1130-7044, address Cibubur Jakarta Timur, Instagram, TikTok and LinkedIn set, phone/email/facebook/youtube empty.

## Q. Footer reconciliation
Footer form removed. Contact data comes from Kontak & WhatsApp; footer description and copyright live in Lanjutan (`updateAdvancedSettings`, partial update of seo_title, seo_description, footer_description, copyright_text). A warning appears if the copyright text already contains a symbol/year (the footer prints "(c) {year} {company}. {text}").

## R. Navigation manager
Moved to Website > Lanjutan with an explanatory panel: Articles links auto-hide until 3 articles are published; `/financing` always shows as "Pembiayaan" whatever label is stored; core route addresses should not be changed. Constrained destination picker NOT implemented (deferred; free-text URL field kept).

## S. Leads handling
Removed from navigation and from the dashboard. `/admin/leads` still renders; description now says the page is no longer used. Backend (table, actions) untouched.

## T. Content handling
Removed from navigation; per-vehicle Social Content editor removed from the unit page. `/admin/content` kept as an archive view (title "Content (arsip)", no add path). `vehicle-social-content.tsx` remains in the repo, unused (DORMANT). Stored content untouched.

## U. Settings handling
Removed from navigation; placeholder route untouched.

## V. Article editor
Primary: Title, Body, Status (Draft/Published). Under "Lanjutan (opsional)" (auto-opens on a slug error): URL slug, excerpt, category, tags, SEO title/description. Backend slug-history behavior untouched; list page copy localized and explains the 3-article gate. Cover/OG upload still on the edit page. Not further overbuilt (0 articles).

## W. Dead-control audit
| Concept | Remaining occurrences | Class |
|---|---|---|
| Why Perkasa | actions, data readers, types, comments in `lib/` | DORMANT_BACKEND |
| Testimonials | `testimonials-section.tsx` (unused public component), actions, data | DORMANT_BACKEND |
| Simulasi Kredit | only a code comment; CMS label still stored | STALE_REMOVE via CMS patch |
| Leads | route, data, actions, types | DORMANT_BACKEND |
| Content Library | `/admin/content`, actions, `vehicle-social-content.tsx` | DORMANT_BACKEND (component unused) |
| Settings | placeholder route | DORMANT_BACKEND |
| Feature on homepage / is_featured | column, type, optional `VehicleInput.isFeatured`, `getFeaturedVehicles` | DORMANT_BACKEND (no owner control) |
| is_published | derived in `setVehicleStatus`, shown as "Tayang" indicator | ACTIVE_AND_VALID (not an owner decision) |
| kualitas terjamin / inspeksi / kurasi in code | none (admin and public) | clean; CMS rows still hold "berkualitas" and legacy About text (see AC) |
| `lib/utils/benefit-icons.ts` "Sparkles (Premium)" | admin-only icon label, now unused UI | DORMANT_BACKEND |

## X. Admin browser QA
**NOT VERIFIED for signed-in admin screens.** The admin is behind Supabase Auth and I may not enter credentials; none were provided as a test login. What was verified: production build compiles all admin routes (29/29); unauthenticated requests to `/admin`, `/admin/dashboard`, `/admin/inventory`, `/admin/inventory/new`, `/admin/website`, `/admin/website/advanced`, `/admin/articles`, `/admin/leads` all redirect (307) to `/admin/login`, and the login page renders. Not exercised in a browser: sidebar items, tabs, quick actions, create form, Website tabs, article form, mobile layout at 390/768/1280/1440. Recommended: Owner (or an owner-approved test account) runs a short signed-in walk-through before merge. The Chrome-extension browser also still cannot reach localhost, so any QA used headless Edge over CDP.

## Y. Public regression QA
Headless Edge/CDP against the production build. Homepage 1440/1280/768/390: sections Unit Tersedia, Cara Pembelian, Unit Terjual, final CTA; no Why Perkasa/Testimonials/Articles; no overflow; 0 console errors; 0 nested anchors. (One cold-cache run reported 7 broken images at 1440; a re-run showed 0.) Also checked /financing, /about, /contact, /articles (1440 and 390), /cars, /motorcycles, available and sold detail: no overflow, no errors, same headings as Phase 2R.2-2R.4. Admin changes touched no public components; the only shared edits are `lib/data/vehicles.ts` (one new admin-only reader) and `lib/actions/vehicles.ts`.

## Z. Lint / typecheck / build / npm audit
Lint PASS. `npx next typegen` + `npx tsc --noEmit` PASS. `npm run build` PASS (29/29). `npm audit --omit=dev`: 0 vulnerabilities. Full `npm audit`: 1 high (transitive dev-tooling `brace-expansion`), unchanged; not fixed.

## AA. Changed files
Modified: `app/(admin)/admin/(shell)/dashboard/page.tsx`, `inventory/page.tsx`, `inventory/new/page.tsx`, `inventory/[id]/page.tsx`, `website/page.tsx`, `website/homepage/page.tsx`, `website/about/page.tsx`, `website/footer/page.tsx` (redirect), `website/navigation/page.tsx` (redirect), `articles/page.tsx`, `leads/page.tsx`, `content/page.tsx`; `components/admin/nav-items.tsx`, `sidebar.tsx`, `topbar.tsx`, `vehicle-form.tsx`, `website-subnav.tsx`, `article-form.tsx`; `lib/actions/vehicles.ts`, `lib/actions/site-settings.ts`, `lib/data/vehicles.ts`, `lib/data/site-settings.ts` (comment), `lib/types/site-settings.ts` (comment).
Added: `app/(admin)/admin/(shell)/website/advanced/page.tsx`, `components/admin/inventory-list.tsx`, `vehicle-status-actions.tsx`, `contact-whatsapp-form.tsx`, `advanced-settings-form.tsx`, `lib/utils/admin-vehicle.ts`.
Deleted: `components/admin/inventory-table.tsx`, `website-general-form.tsx`, `website-footer-form.tsx`, `homepage-about-form.tsx`, `homepage-why-perkasa-form.tsx`, `homepage-testimonials-form.tsx`, `about-page-form.tsx`, `lib/actions/footer.ts`.
Plus this report (md/txt) and `.ruflo/coordination/tasks/PHASE-2R5.json`.

## AB. Scope verification
No migration, schema, table, data deletion, CMS write or Supabase write (live read-only queries were limited to public anon reads of `website_settings`, `navigation_items`, `about_page_sections`, `testimonials`, `articles`, used to prepare the patch). No public component changed. No financial/OS data added. Package files untouched.

## AC. OWNER-APPROVAL CMS CONTENT PATCH
Read-only snapshot taken 2026-10-01 from the live database. **WRITE EXECUTED: NO for every item below.** Staging and production share one Supabase project, so each write would be live immediately.

**Item 1 - hero body "berkualitas"**
TABLE: `website_settings`
ROW IDENTIFIER: `id = 1`
FIELD: `hero_1_description`
CURRENT VALUE: "Pilihan unit kendaraan berkualitas dengan informasi yang jelas dan proses pembelian yang mudah."
PROPOSED VALUE: "Pilihan unit kendaraan dengan informasi yang jelas dan proses pembelian yang mudah."
REASON: "berkualitas" is an unsupported quality claim; the rest is factual.
PUBLIC IMPACT: homepage hero slide 1 body text only.
WRITE EXECUTED: NO
(Admin path to do it: Website > Beranda > slide 1.)

**Item 2 - footer description "berkualitas"**
TABLE: `website_settings`; ROW IDENTIFIER: `id = 1`; FIELD: `footer_description`
CURRENT VALUE: "Pilihan kendaraan berkualitas, informasi transparan, dan pengalaman pembelian yang lebih mudah."
PROPOSED VALUE: "Mobil dan motor dengan informasi yang jelas, dan proses pembelian lewat WhatsApp."
REASON: removes the generic quality claim; "transparan" replaced by the concrete "informasi yang jelas".
PUBLIC IMPACT: footer text on every public page.
WRITE EXECUTED: NO
(Admin path: Website > Lanjutan > Footer.)

**Item 3 - doubled copyright**
TABLE: `website_settings`; ROW IDENTIFIER: `id = 1`; FIELD: `copyright_text`
CURRENT VALUE: "© 2026 Perkasa Motors. All rights reserved." (the footer already prints "© {year} Perkasa Motors. " before it, producing "© 2026 Perkasa Motors. © 2026 Perkasa Motors. All rights reserved.")
PROPOSED VALUE: "All rights reserved."
REASON: the symbol, year and company name are added by the footer.
PUBLIC IMPACT: footer copyright line on every public page; also future-proofs the year.
WRITE EXECUTED: NO
(Admin path: Website > Lanjutan > Teks hak cipta; the new form warns about this.)

**Item 4 - navigation label "Simulasi Kredit" (two rows)**
TABLE: `navigation_items`
ROW IDENTIFIER: `id = 25c73cb7-fe4b-4022-b518-e000873be931` (placement HEADER, href /financing) and `id = 3bac7b0d-ea2a-4cac-a8b6-618afacfead5` (placement FOOTER_NAV, group "Navigasi", href /financing)
FIELD: `label`
CURRENT VALUE: "Simulasi Kredit" (both)
PROPOSED VALUE: "Pembiayaan" (both)
REASON: the page is no longer a numeric simulator; public code already relabels it at runtime, so the CMS and the site disagree until the stored value is changed.
PUBLIC IMPACT: none visible (the runtime rule already shows "Pembiayaan"); admin shows the true value.
WRITE EXECUTED: NO

**Item 5 - footer navigation "Articles" (informational, optional)**
TABLE: `navigation_items`; ROW IDENTIFIER: `id = de854216-5494-4cea-bd69-a6391eb1280c` (FOOTER_NAV, href /articles); FIELD: `label`
CURRENT VALUE: "Articles"; PROPOSED VALUE: "Artikel"
REASON: Indonesian label for when the link appears (>= 3 published articles; hidden today).
PUBLIC IMPACT: none today. WRITE EXECUTED: NO

**Item 6 - legacy About sections (not rendered; decision needed)**
TABLE: `about_page_sections`; ROW IDENTIFIERS: `4e6badb4-18e3-4c7e-bed7-7b2c761e6c93` (key hero, headline "Merancang ulang standar kemewahan.") and `4becc88d-bb88-4f01-a110-eae14535b03a` (key story, headline "Presisi, Performa, Perkasa.")
FIELD: `is_active` (and body text that mentions kurasi / inspeksi internal)
CURRENT VALUE: both active
PROPOSED VALUE: set `is_active = false` for both (do not delete)
REASON: unsupported claims; also keeps them from reappearing if the About page is later reconnected to the CMS.
PUBLIC IMPACT: none today (the public page ignores them). WRITE EXECUTED: NO

**Item 7 - homepage About and Why Perkasa flags (not rendered; hygiene)**
TABLE: `website_settings`; ROW IDENTIFIER: `id = 1`; FIELDS: `about_is_active`, `why_perkasa_is_active`
CURRENT VALUE: both true; PROPOSED VALUE: false
REASON: sections are retired; avoids resurrecting them if the homepage is changed later.
PUBLIC IMPACT: none today. WRITE EXECUTED: NO

**Item 8 - inactive hero slide 3 (informational)**
FIELD: `hero_3_description` mentions "pengalaman nyata customer" (a testimonial-style claim); the slide is inactive (`hero_3_is_active = false`). Recommended: leave inactive, rewrite before ever activating. WRITE EXECUTED: NO

Future patch plan: owner reviews the proposed values; then either (a) the owner edits items 1-4 in the admin screens named above (preferred: no database tooling, uses revalidation), or (b) a reviewed one-off SQL script updates `website_settings` id=1 and the two `navigation_items` rows and the owner confirms the public pages afterwards. Items 6-8 are optional hygiene and need SQL (no admin screen edits them any more). Take a before-snapshot of the rows first.

## AD. Remaining owner facts
OWNER_FACT_REQUIRED: opening hours; showroom visit policy; accuracy of the four buying steps; financing assistance and partners; whether Instagram, TikTok and LinkedIn are active channels (all three are shown in the footer); whether Perkasa wants phone/email shown; wording for items 1-3 above.

## AE. Phase 2R.6 readiness
Code-ready. Before 2R.6 the Owner should (1) approve or amend the CMS content patch, and (2) run the signed-in admin walk-through that this phase could not do (X). Known follow-ups: constrained navigation destination picker; HEIC upload message and drag reorder; `vehicle-social-content.tsx`, dormant actions and the About/Why Perkasa/Testimonials tables can be retired in a later cleanup; RESERVED -> AVAILABLE then delete can release a once-reserved stock number (decide whether to forbid deleting vehicles that were ever reserved; needs status history, i.e. Phase 2R.6).
