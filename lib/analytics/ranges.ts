/**
 * Marketing Analytics date model (pure, no imports so it can be unit-tested
 * directly with `node --test`). All calendar dates are Asia/Jakarta.
 *
 * Every window ENDS YESTERDAY (Jakarta) so a partial day never distorts a
 * summary, and is inclusive of both ends. Search Console needs a longer
 * lag and uses Pacific-Time dates at the source, so its window is
 * resolved separately (see resolveSearchRange).
 */

export const RANGE_KEYS = ["7d", "30d", "90d"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];
export const DEFAULT_RANGE: RangeKey = "30d";

const DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 };
/** Search Console data is available with roughly a 2–3 day delay. */
export const SEARCH_LAG_DAYS = 3;

export interface DateRange {
  key: RangeKey;
  /** YYYY-MM-DD, inclusive. */
  startDate: string;
  /** YYYY-MM-DD, inclusive. */
  endDate: string;
  days: number;
}

/** Anything unknown (missing, repeated, tampered) falls back to the default. */
export function parseRange(value: string | string[] | undefined): RangeKey {
  const v = Array.isArray(value) ? value[0] : value;
  return (RANGE_KEYS as readonly string[]).includes(v ?? "") ? (v as RangeKey) : DEFAULT_RANGE;
}

/** Calendar date (YYYY-MM-DD) of `now` in Asia/Jakarta (UTC+7, no DST). */
export function jakartaDate(now: Date): string {
  return new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD date by whole days (pure calendar math, no timezone drift). */
export function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

function windowEndingOn(key: RangeKey, endDate: string): DateRange {
  const days = DAYS[key];
  return { key, startDate: addDays(endDate, -(days - 1)), endDate, days };
}

/** GA4 window: the `days` completed Jakarta days ending yesterday. */
export function resolveRange(key: RangeKey, now: Date): DateRange {
  return windowEndingOn(key, addDays(jakartaDate(now), -1));
}

/** Search Console window: same length, ending SEARCH_LAG_DAYS days before today (Jakarta). */
export function resolveSearchRange(key: RangeKey, now: Date): DateRange {
  return windowEndingOn(key, addDays(jakartaDate(now), -SEARCH_LAG_DAYS));
}

/** GA4 returns the `date` dimension as YYYYMMDD. */
export function ga4DateToIso(value: string): string {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
}

/** Every date in the range, so a trend chart shows days with no traffic as zero instead of skipping them. */
export function eachDate(range: Pick<DateRange, "startDate" | "endDate">): string[] {
  const out: string[] = [];
  for (let d = range.startDate; d <= range.endDate; d = addDays(d, 1)) out.push(d);
  return out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "4 Sep 2026" */
export function formatIsoDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatRangeLabel(range: Pick<DateRange, "startDate" | "endDate">): string {
  return `${formatIsoDate(range.startDate)} – ${formatIsoDate(range.endDate)}`;
}
