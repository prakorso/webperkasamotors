import test from "node:test";
import assert from "node:assert/strict";
import { parseRange, resolveRange, resolveSearchRange, jakartaDate, addDays, eachDate, ga4DateToIso, formatRangeLabel } from "../../lib/analytics/ranges.ts";

test("parseRange accepts 7d/30d/90d and falls back to 30d for anything else", () => {
  assert.equal(parseRange("7d"), "7d");
  assert.equal(parseRange("90d"), "90d");
  assert.equal(parseRange(undefined), "30d");
  assert.equal(parseRange("365d"), "30d");
  assert.equal(parseRange("../etc"), "30d");
  assert.equal(parseRange(["7d", "90d"]), "7d");
});

test("windows end YESTERDAY in Asia/Jakarta and are inclusive", () => {
  const now = new Date("2026-10-04T02:00:00Z"); // 09:00 on 4 Oct in Jakarta
  assert.deepEqual(resolveRange("7d", now), { key: "7d", startDate: "2026-09-27", endDate: "2026-10-03", days: 7 });
  assert.equal(resolveRange("30d", now).startDate, "2026-09-04");
  assert.equal(resolveRange("90d", now).startDate, "2026-07-06");
  assert.equal(eachDate(resolveRange("30d", now)).length, 30);
});

test("Jakarta date, not UTC date, decides 'yesterday' (UTC still on the previous day)", () => {
  const now = new Date("2026-10-03T18:00:00Z"); // 01:00 on 4 Oct in Jakarta
  assert.equal(jakartaDate(now), "2026-10-04");
  assert.equal(resolveRange("7d", now).endDate, "2026-10-03");
});

test("Search Console window ends 3 days before today (Jakarta)", () => {
  const now = new Date("2026-10-04T02:00:00Z");
  const r = resolveSearchRange("7d", now);
  assert.equal(r.endDate, "2026-10-01");
  assert.equal(r.startDate, "2026-09-25");
});

test("date helpers", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(ga4DateToIso("20261003"), "2026-10-03");
  assert.equal(formatRangeLabel({ startDate: "2026-09-27", endDate: "2026-10-03" }), "27 Sep 2026 – 3 Okt 2026");
});
