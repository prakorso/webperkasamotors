import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateCta, buildAcquisition, buildTrend, customDimensionPending, joinVehicles, mapGa4Rows, mapSearchRows,
  searchTotals, sumMetric, waConversionRate,
} from "../../lib/analytics/metrics.ts";
import { formatCount, formatPercent, formatPosition } from "../../lib/analytics/format.ts";
import { AnalyticsError, settle } from "../../lib/analytics/sections.ts";

const ga = (dims, mets) => ({
  dimensionHeaders: dims.map((name) => ({ name })),
  metricHeaders: mets.map((name) => ({ name })),
});

test("mapGa4Rows keys values by header name and coerces metrics to numbers", () => {
  const rows = mapGa4Rows({
    ...ga(["date", "itemId"], ["itemsViewed"]),
    rows: [{ dimensionValues: [{ value: "20261003" }, { value: "CAR-0001" }], metricValues: [{ value: "3" }] }],
  });
  assert.deepEqual(rows, [{ dim: { date: "20261003", itemId: "CAR-0001" }, met: { itemsViewed: 3 } }]);
  assert.deepEqual(mapGa4Rows({}), []);
  assert.equal(sumMetric(rows, "itemsViewed"), 3);
});

test("WA conversion rate = sessions WITH a click / sessions, never events / sessions", () => {
  // Real Phase 1 proof window: 11 click events in only 4 sessions out of 8.
  assert.equal(waConversionRate(4, 8), 0.5);
  assert.notEqual(waConversionRate(4, 8), 11 / 8); // the rejected eventCount formula would give 137.5%
  assert.equal(waConversionRate(0, 8), 0);
  assert.equal(waConversionRate(3, 0), null);
  assert.equal(waConversionRate(9, 8), 1); // split queries can overshoot; capped at 100%
});

test("acquisition merges four queries by (source/medium, campaign) and never invents rows", () => {
  const dims = ["sessionSourceMedium", "sessionCampaignName"];
  const row = (s, c, m) => ({ dimensionValues: [{ value: s }, { value: c }], metricValues: m.map((value) => ({ value })) });
  const base = mapGa4Rows({ ...ga(dims, ["sessions", "activeUsers"]), rows: [row("(not set)", "(not set)", ["6", "2"]), row("l.instagram.com / referral", "(referral)", ["2", "1"])] });
  const wa = mapGa4Rows({ ...ga(dims, ["sessions"]), rows: [row("(not set)", "(not set)", ["4"]), row("ghost / none", "(none)", ["9"])] });
  const views = mapGa4Rows({ ...ga(dims, ["eventCount"]), rows: [row("(not set)", "(not set)", ["4"])] });
  const clicks = mapGa4Rows({ ...ga(dims, ["eventCount"]), rows: [row("(not set)", "(not set)", ["9"])] });
  const out = buildAcquisition(base, wa, views, clicks);
  assert.equal(out.length, 2); // the "ghost" row existing only in a secondary query is ignored
  assert.deepEqual(out[0], { sourceMedium: "(not set)", campaign: "(not set)", users: 2, sessions: 6, vehicleViews: 4, whatsappClicks: 9, waSessions: 4, conversionRate: 4 / 6 });
  assert.equal(out[1].conversionRate, 0);
});

const vehicles = [
  { stockNumber: "CAR-0001", label: "Hyundai Grand Avega 2012", status: "AVAILABLE", createdDate: "2026-08-18" },
  { stockNumber: "MOT-0012", label: "Yamaha R15 V3 2019", status: "SOLD", createdDate: "2026-10-03" },
  { stockNumber: "CAR-0009", label: "Reused number", status: "AVAILABLE", createdDate: "2026-10-03" },
];

test("inventory join: item_id -> stock_number, orphans reported, (not set) skipped", () => {
  const views = [
    { date: "2026-10-03", itemId: "CAR-0001", value: 3 },
    { date: "2026-10-03", itemId: "MOT-0012", value: 1 },
    { date: "2026-10-03", itemId: "QA-GHOST-9", value: 2 },
    { date: "2026-10-03", itemId: "(not set)", value: 5 },
  ];
  const r = joinVehicles(views, null, vehicles);
  assert.deepEqual(r.rows.map((x) => [x.stockNumber, x.views]), [["CAR-0001", 3], ["MOT-0012", 1], ["CAR-0009", 0]]);
  assert.deepEqual(r.orphans, [{ itemId: "QA-GHOST-9", views: 2, clicks: 0 }]);
  assert.equal(r.clicksAvailable, false);
  assert.equal(r.rows[0].clicks, null);
  assert.equal(r.rows[0].clicksPerView, null);
});

test("stock-number reuse safeguard: analytics dated before the vehicle's created_at are ignored", () => {
  const views = [
    { date: "2026-10-02", itemId: "CAR-0009", value: 7 }, // belongs to a vehicle that held the number earlier
    { date: "2026-10-03", itemId: "CAR-0009", value: 2 }, // same day as creation: inclusive, kept
  ];
  const clicks = [
    { date: "2026-09-30", itemId: "CAR-0009", value: 4 },
    { date: "2026-10-03", itemId: "CAR-0009", value: 1 },
  ];
  const r = joinVehicles(views, clicks, vehicles);
  const row = r.rows.find((x) => x.stockNumber === "CAR-0009");
  assert.equal(row.views, 2);
  assert.equal(row.clicks, 1);
  assert.equal(row.clicksPerView, 0.5);
  assert.deepEqual(r.droppedBeforeCreated, { views: 7, clicks: 4 });
});

test("custom dimension pending when only (not set) values exist", () => {
  const pending = mapGa4Rows({ ...ga(["customEvent:cta_location"], ["eventCount"]), rows: [{ dimensionValues: [{ value: "(not set)" }], metricValues: [{ value: "11" }] }] });
  assert.equal(customDimensionPending(pending, "customEvent:cta_location"), true);
  const ready = mapGa4Rows({ ...ga(["customEvent:cta_location"], ["eventCount"]), rows: [{ dimensionValues: [{ value: "hero" }], metricValues: [{ value: "2" }] }, { dimensionValues: [{ value: "(not set)" }], metricValues: [{ value: "11" }] }] });
  assert.equal(customDimensionPending(ready, "customEvent:cta_location"), false);
  assert.equal(customDimensionPending([], "customEvent:cta_location"), true);
});

test("CTA aggregation: all canonical locations, unclassified kept apart, shares of ALL clicks", () => {
  const row = (loc, n) => ({ dimensionValues: [{ value: loc }], metricValues: [{ value: String(n) }] });
  const rows = mapGa4Rows({ ...ga(["customEvent:cta_location"], ["eventCount"]), rows: [row("hero", 3), row("sell_form", 1), row("(not set)", 6), row("brand_new_cta", 2)] });
  const r = aggregateCta(rows);
  assert.equal(r.total, 12);
  assert.equal(r.unclassified, 6);
  assert.equal(r.rows.filter((x) => x.canonical).length, 11);
  assert.deepEqual(r.rows[0], { location: "hero", clicks: 3, share: 0.25, canonical: true });
  const unknown = r.rows.find((x) => x.location === "brand_new_cta");
  assert.equal(unknown.canonical, false);
  assert.equal(r.rows.find((x) => x.location === "footer").clicks, 0);
});

test("Search Console mapping: rows, totals from the API, null when Google has no rows", () => {
  assert.equal(searchTotals({}), null);
  assert.equal(searchTotals({ rows: [] }), null);
  assert.deepEqual(searchTotals({ rows: [{ clicks: 5, impressions: 100, ctr: 0.05, position: 7.3 }] }), { clicks: 5, impressions: 100, ctr: 0.05, position: 7.3 });
  assert.deepEqual(mapSearchRows({ rows: [{ keys: ["jual mobil"], clicks: 2, impressions: 40, ctr: 0.05, position: 4 }] }), [{ key: "jual mobil", clicks: 2, impressions: 40, ctr: 0.05, position: 4 }]);
  assert.deepEqual(mapSearchRows({}), []);
});

test("trend is zero-filled for every day of the range", () => {
  const t = buildTrend(["2026-10-01", "2026-10-02", "2026-10-03"], [{ date: "2026-10-03", sessions: 8 }], [{ date: "2026-10-03", clicks: 11 }]);
  assert.deepEqual(t.map((p) => [p.sessions, p.whatsappClicks]), [[0, 0], [0, 0], [8, 11]]);
});

test("source-specific fallback: a failing GA4 section does not affect Search, and raw errors never leak", async () => {
  const [ga4, search] = await Promise.all([
    settle(async () => { throw new AnalyticsError("QUOTA", "Kuota GA4 sedang penuh. Coba lagi nanti."); }),
    settle(async () => ({ state: "ok", data: { clicks: 1 }, fetchedAt: "2026-10-04T00:00:00Z" })),
  ]);
  assert.equal(ga4.state, "error");
  assert.equal(ga4.code, "QUOTA");
  assert.equal(search.state, "ok");
  const unknown = await settle(async () => { throw new Error("Bearer ya29.SECRET-TOKEN failed"); });
  assert.equal(unknown.state, "error");
  assert.equal(unknown.code, "UNKNOWN");
  assert.ok(!JSON.stringify(unknown).includes("SECRET"));
});

test("Indonesian formatting", () => {
  assert.equal(formatCount(1250), "1.250");
  assert.equal(formatPercent(0.125), "12,5%");
  assert.equal(formatPercent(null), "—");
  assert.equal(formatPosition(7.34), "7,3");
  assert.equal(formatPosition(0), "—");
});
