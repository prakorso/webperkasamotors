# Phase 2C.2 — Vehicle Content Editorial Review

**Date:** 2026-09-30
**Scope:** Every vehicle currently visible on the public site (15 rows — `is_published = true`, status in AVAILABLE/RESERVED/SOLD, read via the anon/publishable Supabase client, same visibility rules the public site itself uses).
**Purpose:** Classify each vehicle's content quality per Phase 2C.2 CTO/CMO instructions. **No highlights, descriptions, or years were rewritten or corrected as part of this review** — this is a report for a human to act on, not a content change.

## How to read this

- **SAFE** — no known factual contradiction; content is usable as-is.
- **NEEDS EDITORIAL REVIEW** — no factual error, but the content doesn't match its field's intent and should be rewritten by a human (applies to every vehicle — see finding below).
- **NEEDS HUMAN VERIFICATION** — a factual contradiction or data-integrity anomaly that only someone with the paperwork/photos can resolve. Not touched.

## Systemic finding: `highlights` is not being used as "highlights"

All 15 vehicles' `highlights` arrays contain full seller ad-copy (WhatsApp-broadcast style Indonesian listing text) split one sentence/line per array element — 5 to 27 items per vehicle, e.g.:

```
"MOTOR YAMAHA R15 V3 2017 WARNA BLUE MODIF GANTENG (SS LENGKAP & PLAT B JAKARTA)"
"HARGA : 13.500.000 NET 🔥"
"- SS LENGKAP (BPKB, STNK, FAKTUR) (STNK 2022, PLAT 2022)"
... 19 more lines ...
```

This is description/ad-copy content living in the highlights column, not curated 3–5 bullets. Per the phase brief's Section 5, highlights should say what the spec grid can't (document status, condition notes, notable equipment) in 3–5 concise lines — not restate price, not repeat brand/model/year/transmission, and never invent claims the data doesn't support.

**What this phase did about it (UI only, no content rewrite):** the vehicle detail page's highlights block was changed from a wrapped pill/chip grid (unreadable with full-sentence content) to a plain list, showing the first 5 lines with the rest behind a native "Lihat N sorotan lainnya" disclosure — see `components/public/vehicle-detail.tsx`. This keeps every word the seller/admin entered reachable and keeps the CTA close to the top of the page, without deleting, reordering-for-effect, or rewriting a single word.

**What still needs a human:** an admin should rewrite `highlights` for all 15 vehicles down to genuine 3–5 bullets (e.g. "Dokumen lengkap", "Bebas banjir & laka", "Servis record Hyundai asli" — extracted from what's already there, not invented). Not done automatically per the phase brief's explicit instruction.

## Per-vehicle classification

| Stock # | Vehicle | Status | Year field | Year in ad text | Classification |
|---|---|---|---|---|---|
| MOT-0001 | Yamaha R15 V3 Sport | SOLD | 2019 | "2017" | **NEEDS HUMAN VERIFICATION** — year contradiction (new finding, not previously flagged) |
| MOT-0005 | Yamaha R15 V3 Sport | SOLD | 2019 | "2019" | SAFE |
| CAR-0001 | Hyundai Grand Avega Hatchback | AVAILABLE | 2012 | "2012" | SAFE |
| MOT-0006 | Suzuki GSX R Sport | SOLD | 2019 | (not stated) | SAFE |
| MOT-0007 | Yamaha R15 V3 Sport | SOLD | 2026 | "2017" | **NEEDS HUMAN VERIFICATION** — year contradiction (named in phase brief) |
| CAR-0002 | Hyundai Avega Liftback | SOLD | 2009 | "2009" | SAFE |
| CAR-0003 | Hyundai Grand Avega Hatchback | SOLD | 2013 | "2013" | SAFE |
| CAR-0004 | Hyundai Tucson SUV | SOLD | 2012 | "2011" | **NEEDS HUMAN VERIFICATION** — year contradiction (new finding, not previously flagged) |
| CAR-0006 | Hyundai Grand Avega Hatchback | SOLD | 2012 | "2012" | SAFE |
| CAR-0007 | Hyundai Grand Avega Hatchback | SOLD | 2013 | "2012" | **NEEDS HUMAN VERIFICATION** — year contradiction (named in phase brief) |
| CAR-0008 | Hyundai Grand Avega Hatchback | SOLD | 2013 | "2012" | **NEEDS HUMAN VERIFICATION** — year contradiction (new finding, not previously flagged) |
| MOT-0008 | Yamaha R15 V3 Sport | SOLD | 2019 | (not stated) | SAFE |
| MOT-0009 | Yamaha R15 V3 Sport | SOLD | 2022 | (not stated) | SAFE |
| MOT-0010 | Suzuki GSX R Sport | AVAILABLE | 2017 | (not stated) | SAFE |
| QA-PAGN-01 | Hyundai Grand Avega Hatchback | SOLD | 2013 | (not stated) | **NEEDS HUMAN VERIFICATION** — see below |

Every row also carries the systemic "highlights needs editorial rewrite" finding above; it isn't repeated per-row.

## Individual NEEDS HUMAN VERIFICATION notes

- **MOT-0001, MOT-0007, CAR-0004, CAR-0007, CAR-0008** — the stored `year` field disagrees with the year written into the seller's own ad copy (now living in `highlights`). Three of these (MOT-0007, CAR-0007, and the general pattern) match what the phase brief already named; **MOT-0001 and CAR-0004 are additional instances found during this review** using the same check. None of the five were modified — a human needs to check the vehicle's actual STNK/BPKB to determine which year is correct (the ad text, entered closer to the sale, or the structured `year` field).
- **MOT-0001** additionally has `description = "Test"` — literal placeholder text, not real content. It is no longer displayed anywhere on the public site as of this phase (the description field/paragraph was removed from the vehicle detail page — see "What was removed" in the phase summary), so it's no longer customer-visible, but the column itself still holds "Test" and should be cleared by an admin when convenient.
- **QA-PAGN-01** — this vehicle's stock number doesn't match the site's generated format (`CAR-0001`, `CAR-0002`, …, from `generate_stock_number()` — see `supabase/migrations/20260815050000_vehicle_stock_number_generation.sql`). A stock number like this can only exist if the row was inserted directly into the database rather than through the CMS's Create Vehicle flow, which suggests it may be leftover QA/test fixture data rather than a real sold unit. It is currently `is_published = true`, `status = SOLD`, and appears in the public SOLD catalogue and sitemap. **Recommend a human confirm whether this is a real historical sale (keep) or test data that leaked into production (archive or delete).** Not touched in this phase.

## Media / alt text

100/100 `vehicle_media` rows across all 15 vehicles have `alt_text = ""` (every upload goes through `lib/actions/vehicle-media.ts`, which always inserts an empty string — there is no CMS field to fill it in, by design). This phase added a deterministic fallback (`vehicleMediaAlt()` in `lib/utils/format.ts`): `"{Brand Model Variant} {Year} — foto {N}"`, using the photo's stored `sort_order` for N. No CMS field was added, and any real alt text entered in the future is preserved and takes priority over the fallback.

## What was intentionally not done

- No `highlights`, `description`, or `year` values were edited, rewritten, or corrected for any vehicle.
- No records were archived, deleted, or unpublished — including CAR-0007, MOT-0007 (Yamaha R15 V3 Sport 2026), and QA-PAGN-01.
