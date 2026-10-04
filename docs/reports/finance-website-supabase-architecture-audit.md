# Finance + Website Supabase — Architecture & Consolidation Readiness Audit

Audit only. No migration, no write, no schema or policy change, no data change. All database access was SELECT / catalog inspection / Supabase advisors. One external check used the Finance app's own public anon key with count-only requests (HTTP `Prefer: count=exact`, `limit=1`) to prove exposure; no row contents were read through it and no write was attempted.

## A. Executive Summary

- **Consolidation readiness: NOT READY.** The audit itself is mostly complete, but the Finance database has critical security debt that must be fixed before anything is moved.
- **Finance database is publicly readable and, by policy, publicly writable.** Verified live with the public anon key (count-only): `units` 51, `capital_allocations` 84, `payroll_people` 1, plus the 6 un-RLS'd backup tables (`units_bak_20260818` 42, `accounts_bak_20260818` 4 which holds account credentials) all answer anonymous requests. 22 of 29 base tables have `allow_all` (`USING true / WITH CHECK true`) policies for `anon`; 6 backup tables have RLS disabled; 41 views are SECURITY DEFINER and readable by `anon`; 18 SECURITY DEFINER RPCs are executable by `anon`.
- **Finance auth is application-level, not Supabase Auth.** `pm_login` compares a plaintext password column; `pm_partner_auth` accepts the literal string `__internal__` as a password and falls back to a hard-coded default if config is missing; the Finance client itself sends `__internal__` for several admin calls. Any anonymous caller can therefore satisfy the gate on settlement, reversal, reserve override, investor and admin-config RPCs. This was read from function source, **not exercised**.
- **No shared vehicle key exists.** Website `vehicles.id` (uuid) / `stock_number`; Finance `units.id` (bigint) with name + sometimes plate. There is no stock number, uuid, VIN or external id link in Finance, and Website plates are placeholders (`B JAKARTA`), so plate cannot link either. Website has an unused `external_id` column (all NULL).
- **Website Supabase is a sound foundation** (RLS correct on every table, staff-scoped writes, lifecycle trigger, stock numbers never reused). Verdict: **SUITABLE WITH REMEDIATION** (minor: leaked-password protection off, two helper RPCs anon-callable by design).
- **Recommended path: Option A** (bring the Finance domain into the Website Supabase `itjytnbipxaflnaplwpd`), preceded by a Finance security lockdown and identity preparation.

## B. Audit Scope

Perkasa Motors / automotive only (inventory, costs, sales, settlement, reserve, capital, funding, liabilities, website publication, media). Property, clothing, F&B, energy excluded.

Open point recorded: the brief labelled project `pefkfuoowzfnbkmygzxo` a "legacy website project, OFF-LIMITS". Evidence shows it is the live **Finance** database (Supabase name "Perkasa Motors Finance"; hard-coded in the Finance repo's `index.html`; schema is entirely finance). The Owner confirmed it should be treated as Finance and audited read-only. The legacy-website label appears to be a mix-up and should be corrected in future briefs.

## C. Repositories / Deployments

| | Website | Finance |
|---|---|---|
| Repo (local) | `~/Vibes Coding/webperkasamotors` | `~/Vibes Coding/perkasamotors` |
| Remote | github.com/prakorso/webperkasamotors | github.com/prakorso/financeperkasamotors |
| origin/main at audit | `480c2a0a9f26dfef00acb08221cc0035eecc8d5d` | `eaf3800675274c6d13a3447597c1033c9451f885` ("Add files via upload") |
| Stack | Next.js 16 App Router, server-side Supabase | Static single-file SPA (`index.html`, ~4k+ lines, PWA, Apps Script folder), browser talks to Supabase directly |
| Deploy | Netlify site `webperkasamotors` → perkasamotors.id (ready, commit_ref = main) | Netlify site `perkasamotorsdashboard` → perkasamotorsdashboard.netlify.app (ready, commit_ref = main) |
| Supabase | `itjytnbipxaflnaplwpd` "Perkasa Motors Website", ap-southeast-1, PG 17 | `pefkfuoowzfnbkmygzxo` "Perkasa Motors Finance", ap-southeast-1, PG 17 |

Environment separation: Website staging and production share one Supabase project (no writes were made). Finance has no staging; the anon key is embedded in the client (expected for anon) and no `service_role` string is present in the Finance client. Environment variable values were not read or printed.

## D. Website Supabase Architecture

Next.js server reads via anon client (public data) and session client (admin, RLS `is_active_staff()`). Staff authenticate with Supabase Auth (3 users = 3 `profiles`: OWNER, ADMIN, STAFF, all active). Storage: 5 public buckets. Lifecycle, stock-number policy and delete protection live in triggers/functions.

## E. Finance Supabase Architecture

Single browser app; all reads/writes through PostgREST with the anon key and `pm_*` SECURITY DEFINER RPCs gated by a shared password string. No Supabase Auth users are used for Finance (custom `accounts` table). 29 base tables, 41 views, 33 functions, 6 triggers.

## F. Website Schema Inventory (public, live counts)

| Table | Rows | Kind | Notes |
|---|---|---|---|
| vehicles | 18 | operational + publication | uuid PK; `stock_number`, slug, plate_number (placeholders), `external_id` (unused), `sold_at`, `status_changed_at`, `price` |
| vehicle_media | 131 | publication | FK vehicle; `is_primary`, `sort_order`; storage objects `vehicle-media` 132 |
| vehicle_status_history | 19 | audit | written by trigger only; staff read |
| vehicle_url_history | 1 | publication | slug redirects |
| stock_number_pool | 0 | stock-number infra | RLS on, zero policies (locked); no longer used for reuse |
| leads | 6 | operational | anon INSERT only, staff read/update/delete |
| profiles | 3 | auth metadata | roles OWNER/ADMIN/STAFF |
| website_settings 1, content 27, navigation_items 9, testimonials 5, articles 0, article_slug_history, homepage_about_media, homepage_benefits, about_page_sections | — | publication/CMS | public read, staff write |

Vehicles: 18 total, 16 SOLD, 2 AVAILABLE, 0 RESERVED/DRAFT/ARCHIVED; all `is_published`. Stock numbers CAR-0001…0008 (no 0005), MOT-0001…0012 (gaps 0002–0004), plus legacy exceptions `QA-PAGN-01/02`. Readers/writers: Next.js public pages (readers), admin server actions (writers), Marketing Analytics (reader). No finance data exists in this database.

## G. Finance Schema Inventory (public, live counts)

Core: `units` 51 (+`units_bak_20260818` 42), `unit_cost_entries` 20, `unit_funding` 9, `unit_partner_agreement` 2, `unit_settlement` 6, `capital_accounts` 6, `capital_allocations` 84, `founder_capital_ledger` 2, `reserve_ledger` 8, `reserve_advances` 0, `reserve_allocation_override` 4, `settlement_variances` 1, `partner_profit_policy` 60, `financial_policy` 1, `funding_assumptions` 5, `kas_keluar` 7 (+bak 6), `debts` 1, `debt_payments` 6, `fee_payments` 0, `payroll_people/rules/obligations/payments` 1 each, `aset_inventori` 2 (+bak 2), `accounts` 4 (+bak 4, plaintext passwords), `app_config` 9 (+bak 3, +bak_phasec 7).

Keys: all PKs `bigint`; FKs to `units(id)`: reserve_ledger, reserve_advances, capital_allocations, settlement_variances (no cascade); cascade for unit_cost_entries, unit_funding, unit_partner_agreement, unit_settlement, fee_payments. No FK from `units` to anything external. No `stock_number`, `uuid`, `vin` column. Views (41): `v_unit_cost`, `v_unit_funding`, `v_unit_economics`, `v_unit_pnl_unified`, `v_profitability`, `v_inventory`, `v_cash_position`, `v_cash_pool`, `v_safe_cash`, `v_balance_sheet`, `v_liabilities`, `v_company_capital`, `v_capital_reconcile`, `v_reserve_summary`, `v_reserve_reconcile`, investor/funding/payroll/debt views, etc.

## H. Functions / Triggers / RPC

**Website** (7 functions): `generate_stock_number` (definer, authenticated-only; allocates CAR/MOT numbers), `vehicles_status_lifecycle` (BEFORE UPDATE OF status: sets `status_changed_at`, sets `sold_at` on first SOLD, appends history), `vehicles_before_delete` (blocks deleting any vehicle that is/was RESERVED or SOLD; stock numbers permanently retired), `is_active_staff`, `current_user_role`, `handle_new_user`, `set_updated_at`. Low migration risk; self-contained.

**Finance** (33 functions, 1 business trigger `trg_perkasa_reserve` on `unit_settlement`): 
- Settlement: `pm_unit_settle_v2` (insert snapshot into `unit_settlement`, set unit `terjual`, sale date/price; refuses if already settled; funding_model must be `perkasa`), `pm_unit_settle_policy` (wraps v2, resolves partner profit % from `partner_profit_policy`, freezes applied %), `pm_unit_settle_reverse` (marks settlement `reversed`, **resets unit to `aktif`, clears sale date/price**), `pm_settle_unit` (older engine for `model_class='current'` units, writes `reserve_ledger`, `capital_allocations.profit_share`, variances), `pm_settlement_eligible`.
- Reserve: `fn_refresh_perkasa_reserve` (deletes and re-inserts the unit's `perkasa_reserve` ledger row; 10% default of realized Perkasa profit unless override; 0 on loss), `fn_sync_perkasa_reserve` (trigger; swallows all errors), `pm_set/clear_reserve_override`, `pm_reserve_advance`.
- Auth/admin: `pm_login`, `pm_partner_auth`, `pm_get/save_admin_config`, `pm_save/delete_investor`.
- Other: payroll (`pm_payroll_run/pay`), debt (`pm_debt_build_schedule/pay`), reports (`fn_pnl`, `fn_position`, `fn_cashflow`, `fn_unit_performance`, `fn_capital_rotation`, `pm_funding_sim`).
- Migration risk: high. Settlement, reserve and reversal logic is encoded in SECURITY DEFINER plpgsql with mutable search_path (33 advisor warnings) and delete-and-reinsert behaviour, so replaying data through it would re-derive, not copy, financial facts.

## I. Website RLS & Security

All 16 public tables RLS-enabled, none forced. Anon can only: read published vehicles (status AVAILABLE/RESERVED/SOLD), their media, website settings/content/CMS; INSERT leads. All writes are `is_active_staff()`. `vehicle_status_history` is staff-read only with no write policy (trigger writes). `stock_number_pool` locked (RLS, no policies). Table-level grants to anon/authenticated are broad but neutralized by RLS. Advisor findings: leaked-password protection disabled (WARN); `is_active_staff` / `current_user_role` anon-executable by design (WARN); `stock_number_pool` RLS without policy (INFO, intentional).
**Website critical RLS issues: 0.**

## J. Finance RLS & Security (FIRST SECURITY SECTION OF THIS AUDIT, see K for backups)

Per-table state (RLS = enabled, never forced; every table also has direct table grants for anon and authenticated):

- RLS enabled, `no_direct_access` (`USING false`): `accounts`, `app_config` — good.
- RLS enabled, SELECT-only `true` for anon: `partner_profit_policy`, `reserve_allocation_override`, `unit_partner_agreement`, `unit_settlement` — **readable by anon** (settlement snapshots incl. partner breakdown).
- RLS enabled but **`allow_all` ALL true for anon+authenticated** (public read AND write): `units`, `aset_inventori`, `capital_accounts`, `capital_allocations`, `debt_payments`, `debts`, `fee_payments`, `financial_policy`, `founder_capital_ledger`, `funding_assumptions`, `kas_keluar`, `payroll_obligations`, `payroll_payments`, `payroll_people`, `payroll_rules`, `reserve_advances`, `reserve_ledger`, `settlement_variances`, `unit_cost_entries`, `unit_funding` (20 tables, counted as critical).
- 41 views: SECURITY DEFINER (advisor ERROR, 41 findings), owner-privileged, granted to anon → financial aggregates exposed regardless of table RLS.
- 18 RPCs SECURITY DEFINER executable by anon (see H). `pm_partner_auth` accepts `__internal__`, so password gating on settle/reverse/override/admin/investor calls is bypassable by design of the current client.
- `accounts` holds plaintext passwords; `app_config` holds admin password/config.

Verified live (count-only, public anon key): `units`, `capital_allocations`, `payroll_people`, `units_bak_20260818`, `accounts_bak_20260818` readable. Writes: allowed by grants and `true` policies; **not exercised** (read-only audit).
**Finance critical issues: 20 write-open tables + 6 RLS-off backups + 41 definer views + 18 anon RPCs (4 classes, all CRITICAL).** Class count: 4 critical classes.

## K. Backup Table Security (RLS DISABLED, 6)

All six verified live as RLS disabled, no policies, full anon/authenticated privileges, readable anonymously:

| Table | Rows | Severity | Contents | Disposition |
|---|---|---|---|---|
| accounts_bak_20260818 | 4 | CRITICAL | login accounts incl. plaintext passwords | ARCHIVE then DROP-LATER |
| app_config_bak_20260818 | 3 | CRITICAL | admin config/secrets | ARCHIVE then DROP-LATER |
| app_config_bak_phasec | 7 | CRITICAL | admin config/secrets | ARCHIVE then DROP-LATER |
| units_bak_20260818 | 42 | HIGH | pre-change unit financials | ARCHIVE |
| kas_keluar_bak_20260818 | 6 | HIGH | expense records | ARCHIVE |
| aset_inventori_bak_20260818 | 2 | MEDIUM | assets | ARCHIVE |

No FK, view or function references them (none observed in the catalog). They look like point-in-time copies from the 2026-08-18 policy transition and a "phase C" config change. Not dropped. No code in the Finance client was found to read them (not exhaustively proven).

## L. Vehicle Identity

- Website: `vehicles.id` uuid (immutable, FK target for media/history), `stock_number` (CAR-NNNN / MOT-NNNN, unique, never reused), `slug`, `plate_number` (placeholder city text such as `B JAKARTA`, not real plates), `external_id` (NULL everywhere).
- Finance: `units.id` bigint, `nama` (free text), `plat` (real plate for 17 of 51; 34 blank), `tahun` text (some blank, one `20120`), `jenis` Mobil/Motor. No stock number, no VIN, no uuid.
- **WEBSITE VEHICLE ↔ FINANCE UNIT mapping mechanism: NONE** (relationship is by human recall of brand/model/year only).

## M. Cross-System Vehicle Reconciliation

Read-only comparison of 18 Website vehicles vs 51 Finance units. No exact or plate/stock link exists, so no match above MEDIUM is possible. Sale dates cannot be used (Website `sold_at` mostly NULL).

| Bucket | Count | Detail |
|---|---|---|
| A. Apparent match | 1 (MEDIUM) | CAR-0002 Hyundai Avega Liftback 2009 ↔ Finance unit 2 (unique brand/model/year on both sides, both SOLD) |
| D. Ambiguous | 12 Website vehicles | Several same brand/model/year candidates on Finance side: R15 V3 (MOT-0001/0005/0007/0008/0009/0012), GSX R (MOT-0006/0010/0011), CAR-0006 Grand Avega 2012. LOW confidence. Year-mismatch candidates: CAR-0004 Tucson 2012 vs Finance Tucson 2011; QA-PAGN-02 Kia Rio 2013 vs Finance "KIA RIO 2014" (LOW); CAR-0001 AVAILABLE vs Finance 75 "Hyundai Grand Avega Black" aktif (LOW) |
| B. Website only | 4 (probable) | CAR-0003, CAR-0007, CAR-0008 (Grand Avega 2013, no 2013 on Finance), QA-PAGN-01 |
| C. Finance only | ~38 sure + remainder | 38 Finance units were acquired/sold before the Website existed (2026-08-14) and cannot exist on it; 13 post-launch Finance units are mostly ambiguous R15/GSX units |
| E. Historical/SOLD | Finance 48 sold, Website 16 sold | |
| F. QA/test/legacy | QA-PAGN-01/02 | No clear Finance counterpart; QA-PAGN-02 resembles Finance 79 (LOW) |
| G. Identifier conflicts | 0 hard conflicts | Plate duplicates in Finance: 0; Website plates unusable |

**HIGH-confidence ID link: NO. CURRENT SHARED IMMUTABLE KEY: none.** Per-row mapping would need Owner confirmation.

## N. Vehicle Lifecycle

- Website `vehicle_status`: DRAFT, AVAILABLE, RESERVED, SOLD, ARCHIVED (observed: AVAILABLE 2, SOLD 16). Trigger records history and `sold_at`; deletion blocked for RESERVED/SOLD history.
- Finance `units.status`: `aktif` / `terjual` (+ `archived_at` soft archive); `settlement_status`: `pending`, `legacy_recorded`, `transition_recorded`, `engine_settled` (and NULL for 9 units, incl. 7 sold); `unit_settlement.status`: `settled` / `reversed`; `model_class` `legacy`/`current`; `funding_model` `legacy`/`perkasa`.
- Conflicts: Finance has no RESERVED/DRAFT; SOLD is set by settlement RPC on Finance and manually in the CMS on Website → duplicate state. `pm_unit_settle_reverse` silently moves Finance back to `aktif` (not irreversible), with no Website equivalent.

## O. Publication Lifecycle

Public visibility = `is_published = true AND status IN (AVAILABLE, RESERVED, SOLD)` (RLS), so DRAFT/ARCHIVED are never public even if `is_published` is true; `is_published = false` hides any status. Fields can contradict (e.g. SOLD + unpublished = hidden; DRAFT + published = hidden). Currently all 18 are published and consistent. Not fixed.

## P. Price Ownership

| Item | Website | Finance | Owner today |
|---|---|---|---|
| Purchase / acquisition cost | none | `unit_cost_entries` category Purchase (7 rows) and `units.harga_beli` (0 on 50 of 51 rows) | FINANCE (but `harga_beli` is dead) |
| Listing price | `vehicles.price` | `units.target_jual` | BOTH (duplicate) |
| Selling price | none (price remains the list price on SOLD) | `units.harga_jual` + `unit_settlement.selling_price` | FINANCE |
| Final negotiated price | none | same | FINANCE |

## Q. Sold Date

- Website: 16 SOLD; **3 have `sold_at`** (MOT-0010/0011/0012, all stamped 2026-10-03, i.e. when they were marked in the CMS, not real sale dates); **13 have none**. Trigger only sets `sold_at` on a change to SOLD after the trigger existed; history has 16 SOLD transitions.
- Finance: 48 sold; **48 have `tgl_jual`** (0 missing, 0 sold before acquired). Settlement date also in `unit_settlement.settle_date` (5 settled).
- So Finance holds the true sale dates; Website `sold_at` is unreliable for 16/16.

## R. Finance Semantic Model (extracted from code; view formulas not fully extracted)

- Base Unit Cost = direct costs only (purchase, service, repair, spare parts, transport, document/tax, direct marketing, other) per `BUSINESS_RULES.md`; payroll/office are opex (`kas_keluar`, 7 rows, Rp 2.3M).
- True unit profit (v2) = (selling price − selling cost) − base unit cost. Partner fee: fixed fee, % of capital, or % of profit; loss shared by `loss_exposure_pct` (default funding share). Perkasa retained = profit − partner fee (negative on loss). Capital return = funding (Perkasa full; partner reduced by loss share).
- Legacy engine (`pm_settle_unit`) works from JSON columns (`biaya_panji`, `biaya_pandu`, `partners`): profit = sale − unit_cost; reserve = round(profit × rate); distributable = profit − reserve − fixed fees; distributed pro-rata on participating capital; rounding residual → `settlement_variances`.
- Cash/liabilities/capital totals are view-derived (`v_cash_position`, `v_liabilities`, `v_company_capital`); those view bodies were not individually reverse-engineered in this audit (**PARTIAL**).

## S. Reserve Policy

Documented: new units reserve 10% of positive realized Perkasa profit unless a valid unit-specific override exists; none on zero/negative profit; legacy units untouched.
Implemented: `financial_policy` row (rate 0.10, effective 2026-08-18); `fn_refresh_perkasa_reserve` (trigger on `unit_settlement`) = round(realized Perkasa profit × rate), override clamped to [0, realized], 0 on loss, deletes/re-inserts the ledger row; `reserve_allocation_override` 4 rows.
**Discrepancy:** the older `pm_settle_unit` engine computes reserve on **gross profit before partner fees** and inserts `retained_profit` rows (3 rows, Rp 1.7M, units 35/37/38 `transition_recorded`), while the trigger path uses **realized Perkasa profit** and writes `perkasa_reserve` rows (5 rows, Rp 1.6M). `v_reserve_reconcile` shows closing reserve Rp 3.3M combining both. Two formulas coexist. Also `fn_sync_perkasa_reserve` swallows errors, so a failed reserve sync is silent.

## T. Capital / Investor Model

`capital_accounts` 6 (2 founder: committed/funded Rp 757.5M; 4 partner: Rp 90M). `capital_allocations` 84: unit-specific (`unit_id`, kind `core_capital`/`partner_funding`, status active/returned, `profit_share`). New-model units also use `unit_funding` (perkasa 7 rows Rp 322M, partner 2 rows Rp 15M). Founder contributions append-only in `founder_capital_ledger` (2 rows). Model is **mixed**: unit-specific allocations plus account-level committed/funded totals plus legacy JSON columns on `units`. Duplicate account names exist for one partner (`Modal Reivan` / `Reivan Modal` / `Reivan`).

## U. Settlement Flow (critical)

1. Admin action: Finance UI "settle unit" with price/cost/date. 2. App: RPC `pm_unit_settle_policy` (partner policy) → `pm_unit_settle_v2`. 3. DB: v2 validates funding model/not-already-settled, reads `v_unit_funding`, computes profit/fees/loss/capital return. 4. Tables: insert `unit_settlement` (immutable snapshot), update `units` (status, tgl_jual, harga_jual); trigger → `reserve_ledger`. Legacy path `pm_settle_unit` additionally writes `capital_allocations`, `reserve_advances`, `settlement_variances`, `units.keuntungan_bersih/kas_bisnis`. 5. Validations: auth gate (bypassable), already-settled check, loss/Custom policy cell must be resolved. 6. Reversibility: `pm_unit_settle_reverse` flips snapshot to `reversed` and unit back to `aktif`; reserve ledger is regenerated by trigger. 7. Audit trail: snapshot row + reversal reason; no actor identity (no per-user auth) and no history table for `units`.
Counts: 5 settled, 1 reversed, 0 sold-`perkasa` units without a settled snapshot.

## V. Cash / Liabilities / Ledger

Debts 1 (active, principal Rp 74.7M, 6 payments), payroll 1 person, `kas_keluar` opex 7, reserve ledger 8, founder ledger 2. Cash pool is derived by views; there is no general double-entry ledger.

## W. Financial Reconciliation (PARTIAL)

Recomputed/compared where the data allows:
- Settled snapshots: true profit Rp 15.25M, Perkasa retained Rp 14.719M (difference Rp 531k = partner fees; consistent with formula).
- `units` stored: sum `keuntungan_bersih` Rp 140.6M over sold units, sum sale Rp 1.1375B (legacy rows carry stored values, no recomputable cost: 50 of 51 units have `harga_beli` 0 and only 7 units have Purchase cost entries, so legacy profit cannot be independently recomputed — **FAIL to verify, not a proven error**).
- Reserve: view closing Rp 3.3M = retentions 1.7M + perkasa_reserve 1.6M (matches ledger; formula inconsistency in S).
- Capital: accounts funded Rp 847.5M vs allocations active Rp 98M (+ returned Rp 749.5M); `v_capital_reconcile` shows 0 `available` and 0 `unfunded_commitment` for all six accounts; no unreconciled variance surfaced there. `settlement_variances` has 1 unresolved row.
Overall: **PARTIAL** — new-model figures reconcile; legacy figures are taken as recorded.

## X. Media / Storage

Website: buckets `vehicle-media` (public, 132 objects), `site-assets` (public, 21), `content-thumbnails`, `testimonials`, `article-media` (public, empty); public-read policies, staff-only write/delete. DB references via `vehicle_media.storage_path` (131 rows vs 132 objects → 1 possible orphan object). Public URL dependency: pages and Next image optimizer allow `itjytnbipxaflnaplwpd.supabase.co`. Storage can stay in the canonical Supabase unmodified. Finance: **no storage buckets used** (none observed in Finance code or config).

## Y. Auth Architecture

Website: Supabase Auth (3 users) + `profiles` roles; session-based RLS. Finance: custom `accounts` (4 rows, plaintext password column) + shared admin password in `app_config`; investors/partners get usernames in `accounts`; no Supabase Auth users. Same humans exist in two systems with no linkage. Consolidation risk: cannot migrate passwords (plaintext vs Supabase hashing); would require invitation/reset and role mapping.

## Z. Current Manual Duplication

| Step done twice | Risk |
|---|---|
| Mark SOLD in Finance (settlement) and in Website CMS | HIGH (SOLD dates already diverge; 13 of 16 Website sold have no `sold_at`) |
| Selling price: Finance `harga_jual`; Website list price stays unchanged | MEDIUM |
| Listing price edited in both (`vehicles.price` vs `units.target_jual`) | MEDIUM |
| Create the vehicle in both (no shared id) | HIGH (identity drift, as reconciliation shows) |
| Archive/withdraw unit in both | MEDIUM |
| Brand/model/year typed twice (inconsistent: "20120", "Grand Avega" vs "GRAND AVEGA") | LOW |

## AA. Source-of-Truth Matrix

| Domain | Current Website | Current Finance | Future owner | Notes |
|---|---|---|---|---|
| Vehicle UUID | `vehicles.id` | none | Canonical vehicles | Becomes FK for finance |
| Stock Number | `stock_number` | none | Canonical vehicles | Human-readable, permanent |
| Brand/Model/Year | yes | free text | Canonical vehicles | Normalize once |
| Plate | placeholder | real, 17/51 | Finance/ops table | Needs data fix |
| VIN/chassis | none | none | Not present | Future field |
| Acquisition cost | none | cost entries | Finance | |
| Repair costs | none | cost entries | Finance | |
| Listing price | `price` | `target_jual` | Shared, single field | |
| Sale price | none | `harga_jual`/snapshot | Finance | |
| Status | yes | `status` + settlement | Finance-driven lifecycle | Website derives public state |
| Sold date | `sold_at` (unreliable) | `tgl_jual` | Finance settlement | |
| Publication | `is_published` | none | Website CMS | |
| Media/Highlights/Description/SEO | yes | none | Website CMS | |
| Funding / Investor capital / Reserve / Settlement / Profit / Cash / Liabilities | none | yes | Finance | |

## AB. Data Quality Findings

Finance: 0 duplicate plates, 34 blank plates, 0 orphan cost entries, 0 negative costs, 0 sold-before-acquired, 0 sold without date, 50 units with `harga_beli` = 0 (purchase cost entries exist for only 7), 7 sold units with NULL settlement_status, 1 archived unit with malformed year (`20120`), duplicate partner account names, 1 unresolved settlement variance. Website: 16 sold with 13 missing `sold_at`, unused `external_id`, placeholder plates, 1 storage object without media row.

## AC. Legacy Data

Finance: `model_class='legacy'` 48 units (incl. 36 `legacy_recorded`, 3 pending, 9 NULL-settlement; 1 of the pending is archived), `current` 3 (`transition_recorded`); `funding_model='legacy'` for 44 units, `perkasa` for 7 later units. Legacy economics must not be re-derived with modern policy (per business rules). Website QA-PAGN-01/02 left untouched; no clear Finance counterpart (QA-PAGN-02 resembles Finance 79 at LOW confidence), classification **uncertain** — Owner decision.

## AD. Dependency Graph (actual schema)

```
Website:   vehicles ─┬─ vehicle_media ─ storage(vehicle-media)
                     ├─ vehicle_status_history
                     └─ vehicle_url_history        profiles ─ auth.users
Finance:   units ─┬─ unit_cost_entries
                  ├─ unit_funding ─ capital_accounts (by name, not FK)
                  ├─ unit_partner_agreement
                  ├─ capital_allocations ─ capital_accounts
                  ├─ unit_settlement ─(trigger)→ reserve_ledger ← reserve_allocation_override
                  ├─ reserve_advances ─ reserve_ledger
                  ├─ settlement_variances, fee_payments
                  accounts/app_config (auth/config), financial_policy, partner_profit_policy (rules)
                  capital_accounts ─ founder_capital_ledger
                  debts ─ debt_payments ; payroll_people ─ rules/obligations/payments
                  views v_* read all of the above
```
Order for any future move: rules/config → capital_accounts → units (with new uuid link) → costs/funding/agreements → allocations → settlements → reserve ledger (regenerate vs copy decision) → debts/payroll → views.

## AE. Canonical Supabase Suitability

Website project `itjytnbipxaflnaplwpd`: **SUITABLE WITH REMEDIATION.** Strengths: correct RLS everywhere, Supabase Auth with roles, lifecycle/history triggers, never-reused stock numbers, working storage, same region and Postgres 17. Gaps: shared staging/production on one project (needs environment strategy before financial data lands), leaked-password protection off, Finance RLS pattern must not be imported, `sold_at` unreliable, no finance role granularity (OWNER/ADMIN/STAFF only; investors/partners need separate read-only roles), extra advisors for RPC grants.

## AF. Consolidation Options

| | A: Finance → Website Supabase | B: Website → Finance Supabase | C: new third project |
|---|---|---|---|
| Migration risk | Medium (finance tables ~1.5k rows, small) | High (move CMS, auth, storage URLs, media) | Highest |
| Downtime risk | Low (Finance app can be repointed) | High (public site depends on it) | Medium |
| Data integrity | Good if identity prepared first | Poor (inherits insecure base) | Good |
| Security | Strong base | Inherits critical debt | Clean but more work |
| Maintenance | One project | One project | Three during transition |
| Unified admin | Natural (same Auth/roles) | Hard | Possible |
| Rollback | Easy (old Finance stays) | Hard | Medium |
**Recommend A.** Do not create a third project.

## AG. Recommended Target Architecture

One Supabase (`itjytnbipxaflnaplwpd`), one `vehicles` identity (uuid, stock_number permanent). Finance tables re-created with a `vehicle_id uuid` FK, owner/admin-only RLS (and read-only investor roles later), no anon grants, RPCs invoker-rights or authenticated-only with real authorization (no password strings), settlement as the single place that sets SOLD (+ `sold_at`) and drives the website public status; Website CMS owns presentation fields only. Separate staging project before financial data lands.

## AH. Migration Risk Register

| Risk | Sev | Likelihood | Mitigation | Blocking |
|---|---|---|---|---|
| Public exposure/tampering of Finance data now | Critical | Present | Lock down first (Phase 0) | YES |
| Wrong vehicle matching | High | High | Owner-confirmed mapping table, no fuzzy auto-link | YES |
| Missing/incorrect sold dates | High | Certain (13/16) | Backfill from Finance `tgl_jual` after mapping | YES |
| Settlement double-apply / reversal side effects | High | Medium | Freeze writes, copy snapshots, never replay engines | YES |
| Two reserve formulas | High | Present | Owner decides canonical formula; migrate recorded values | YES |
| Capital mismatch (duplicate partner accounts) | Medium | Medium | Resolve account identity | YES |
| Plaintext passwords/auth migration | High | Certain | Re-invite users, rotate, never copy | YES |
| Rounding/variance (1 unresolved) | Low | Medium | Carry recorded values | No |
| Trigger side effects (silent reserve sync) | Medium | Medium | Replace with explicit, logged logic | No |
| Storage URL/media | Low | Low | Keep bucket in place | No |
| Backup-table dependency | Low | Low | Archive externally first | No |
| Staging = production on one Supabase | Medium | Present | Separate staging first | YES |

## AI. Required Remediation Before Migration

1. Finance: revoke anon/authenticated access to all tables, views, RPCs; enable RLS on all six backups (or archive and drop); remove `__internal__` and default-password fallbacks; stop storing plaintext passwords; rotate every password and the anon key after cutover of the client. 2. Add Finance sign-in that is not a shared password. 3. Vehicle identity mapping table approved by the Owner. 4. Reserve formula decision. 5. Staging Supabase for the Website project.

## AJ. Proposed Migration Sequence

Phase 0 Finance security lockdown (and rotate secrets). Phase 1 Canonical identity: Owner-approved Finance↔Website mapping, add stable `vehicle_id` plan, backfill real plates/sold dates. Phase 2 Schema preparation in Website Supabase (staging first), roles/RLS. Phase 3 Master data (policies, accounts, partners). Phase 4 Transactions (units, costs, funding, snapshots, ledgers as recorded facts). Phase 5 Reconciliation (counts, sums, view outputs vs source). Phase 6 Unified app cutover. Phase 7 Burn-in. Phase 8 Old Finance project read-only. Phase 9 Decommission after verification.

## AK. Burn-In / Reconciliation Strategy

Row counts and sums per table, per-unit profit/capital/reserve parity, `v_capital_reconcile`/`v_reserve_reconcile` parity, zero-diff gate for N weeks with old project read-only, daily automated comparison.

## AL. Old Finance Project Retirement Conditions

Migration complete; reconciliation PASS; production cutover PASS; no writes to old project; burn-in complete; backup verified; Owner approval. Then read-only → archive/export → decommission. No immediate deletion.

## AM. Owner Decisions Required

1. Confirm the mapping of each Website vehicle to a Finance unit (esp. R15/GSX, Grand Avega 2012/2013, Tucson 2011 vs 2012, Kia Rio 2013 vs 2014). 2. Canonical reserve formula (gross profit vs realized Perkasa profit). 3. Whether QA-PAGN-01/02 are real units. 4. Real plate numbers for Website vehicles. 5. Which duplicate partner accounts are the same person. 6. Which sale date wins when they differ. 7. Approve Option A.

## AN. Final Verdict

Audit: **PARTIAL** (ground truth for identity, security, lifecycle, settlement and reserve is established; view-level financial semantics, a full reader/writer code map and a full independent financial recomputation of legacy units were not completed). Consolidation: **NOT READY** until Phase 0 and identity mapping are done. Immediate priority is Finance security, independent of consolidation: anyone with the (publicly embedded) anon key can currently read the Finance database, and by policy can write it.
