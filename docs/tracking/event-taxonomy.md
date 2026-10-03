# Perkasa Motors — Event Taxonomy (R1B)

The full parameter contract for every dataLayer event the site pushes. Companion to `docs/tracking/measurement-architecture.md` (loader, consent, placement). Source of truth for code: `lib/measurement/events.ts`.

**Funnel truth (unchanged from R0):** the browser's conversion ends at `whatsapp_click`. It means intent — not a lead, not a booking, not a sale. Whether the visitor actually sends the message, and everything downstream (conversation, lead, qualification, site visit, booking, sale) belongs to the future Perkasa OS / CRM, never to browser tracking.

---

## 1. `view_item`

**Trigger:** `components/public/view-item-tracker.tsx`, mounted once inside `VehicleDetail` — fires once per vehicle detail page view (`/cars/[slug]`, `/motorcycles/[slug]`), for **AVAILABLE, RESERVED and SOLD alike** (GA4 is used for behavioral analysis across every status; Meta's `ViewContent` mapping is AVAILABLE-only — see §3).

**GA4 mapping:** recommended event, same name.

| Param | Source | Example |
|---|---|---|
| `currency` | `vehicle.currency` (always `"IDR"`) | `IDR` |
| `value` | `vehicle.price` | `83000000` |
| `vehicle_status` | `vehicle.status` | `AVAILABLE` |
| `vehicle_year` | `vehicle.year` | `2012` |
| `items[0].item_id` | `vehicle.stockNumber` | `CAR-0001` |
| `items[0].item_name` | `${brand} ${model}` | `HYUNDAI GRAND AVEGA` |
| `items[0].item_brand` | `vehicle.brand` | `HYUNDAI` |
| `items[0].item_category` | `vehicle.vehicleType` | `CAR` |
| `items[0].item_variant` | `vehicle.variant` (omitted if unset) | `HATCHBACK` |
| `items[0].price` | `vehicle.price` | `83000000` |

Not a GA4 Key Event.

## 2. `whatsapp_click`

**Trigger:** one delegated `click` listener in `components/public/measurement-loader.tsx`, listening for any `a[data-wa-location]` across the whole document (bubbling, never `preventDefault`— the WhatsApp navigation always proceeds). Every CTA carries its context as `data-wa-*`/`data-item-*` attributes, rendered either by `WhatsAppCta`'s `tracking` prop (7 call sites) or written directly on the 4 raw `<a>` surfaces that predate that component (header, mobile menu, footer, hero).

Deduped: the same `cta_location` + `href` within 1 second is treated as one accidental double-tap, not two events (`lib/measurement/events.ts:isDuplicateClick`).

**GA4 mapping:** custom event, same name. **Marked as a GA4 Key Event** (configured in GTM/GA4, not app code).

**Meta mapping:** `Contact`.

| Param | Always present | Source |
|---|---|---|
| `cta_location` | yes | one of the 11 canonical locations below |
| `cta_context` | yes | `generic` \| `vehicle` \| `payment` \| `sell_vehicle` |
| `page_type` | yes | derived from `window.location.pathname` **at click time** (`inferPageType`), never a static prop |
| `hero_slide_index` | hero, 2–3 slide case only | `HeroSlideshow`'s `activeIndex` at render |
| `list_context` | `vehicle_card` only | `home_available` \| `home_sold` \| `catalogue_available` \| `catalogue_sold` \| `related` |
| `item_id`, `item_name`, `item_brand`, `item_category`, `item_variant` | `cta_context: "vehicle"` only | `vehicleTrackingFields(vehicle)` |
| `vehicle_status` | vehicle-context CTAs, plus `detail_reserved` | `vehicle.status` |
| `value`, `currency` | `cta_context: "vehicle"` only | `vehicle.price`, `"IDR"` |

**Never sent:** destination phone number, full `wa.me` URL, prefilled message text, plate number, staff/auth identity.

### CTA location matrix (all 11 canonical locations)

| `cta_location` | `cta_context` | Component | Vehicle fields? | Notes |
|---|---|---|---|---|
| `header` | `generic` | `site-header.tsx` (raw `<a>`) | no | Desktop nav CTA |
| `mobile_menu` | `generic` | `mobile-nav.tsx` (raw `<a>`) | no | Only in DOM while the panel is open |
| `hero` | `generic` | `hero.tsx` (raw `<a>`) | no | `hero_slide_index` set when rendered via `HeroSlideshow` |
| `vehicle_card` | `vehicle` (AVAILABLE) / `generic` (RESERVED) | `vehicle-card.tsx` via `WhatsAppCta` | AVAILABLE only | RESERVED's "Tanya Unit Lain" is a generic inquiry, never tied to that exact unit (R0 §29) |
| `catalogue_empty_state` | `generic` | `vehicle-catalogue.tsx` + homepage empty state, via `WhatsAppCta` | no | Same canonical location on `/cars`, `/motorcycles` **and** the homepage Unit Tersedia empty state — `page_type` differentiates them |
| `payment_section` | `payment` | `payment-methods-section.tsx` via `WhatsAppCta` | no | "Tanyakan Mekanisme Pembayaran" |
| `detail_inline` | `vehicle` | `vehicle-detail.tsx` via `WhatsAppCta` | yes | AVAILABLE only (RESERVED/SOLD render different blocks) |
| `detail_sticky` | `vehicle` | `mobile-vehicle-cta.tsx` via `WhatsAppCta` | yes | Mobile-only, AVAILABLE only |
| `detail_reserved` | `generic` | `vehicle-detail.tsx` via `WhatsAppCta` | no (status only) | "Tanya Unit Lain" — same generic-message rule as the RESERVED card |
| `sell_form` | `sell_vehicle` | `sell-vehicle-form.tsx` (submit handler → `trackWhatsAppClick`, then `window.open`) | no | `/sell` "Tawarkan Kendaraan". Fired only after the form validates. Not an `<a>`: the generated wa.me URL (which contains the visitor's entries) is never placed in a link, so automatic outbound-click measurement cannot read it. Sends only `cta_location`, `cta_context`, `page_type` — no form value, message or URL. Maps to the existing `whatsapp_click` → Meta `Contact`; no Lead/Purchase. |
| `footer` | `generic` | `site-footer.tsx` (raw `<a>`) | no | |

### `page_type` vocabulary

Derived centrally (`inferPageType`, `lib/measurement/events.ts`) from the pathname, never passed as a prop: `home`, `catalogue_car`, `catalogue_motorcycle`, `detail_car`, `detail_motorcycle`, `privacy`, `sell_vehicle` (`/sell`), `article`, `other`. `article` and `other` exist because `header`/`footer`/`mobile_menu` are global and reachable from every route (including the dormant Articles section), not because those routes have their own WhatsApp CTAs.

## 3. `select_item` and `vehicle_gallery_open` — deferred

Both are optional per the R1B brief (§35–36) with an explicit instruction to defer rather than risk complicating the core release. Neither is implemented in this phase. Candidate `item_list_id` values for a future `select_item` (vehicle card → detail navigation): `home_available`, `home_sold`, `catalogue_available`, `catalogue_sold`, `related` — the same `list_context` vocabulary already wired into `whatsapp_click`'s `vehicle_card` events, so adding `select_item` later only means a new trigger on the card's `Link`, not a new vocabulary.

## 4. Never sent, anywhere

Plate number, visitor name/phone, WhatsApp number, full WhatsApp message text, admin email, staff identity, Supabase auth token/JWT, session secret, password, OTP. Verified by inspection of every `tracking`/`data-wa-*` call site in this document.
