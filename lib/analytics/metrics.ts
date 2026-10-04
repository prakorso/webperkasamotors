/**
 * Marketing Analytics metric logic (pure: no imports, no I/O) — the formulas,
 * result mapping and joins from docs/analytics/marketing-analytics-v1-blueprint.md.
 * Everything here is unit-tested in tests/analytics/ with plain `node --test`.
 */

// ---------------------------------------------------------------------------
// GA4 response mapping
// ---------------------------------------------------------------------------

export interface Ga4ReportResponse {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string }>;
  rows?: Array<{ dimensionValues?: Array<{ value: string }>; metricValues?: Array<{ value: string }> }>;
}

export interface Ga4Row {
  dim: Record<string, string>;
  met: Record<string, number>;
}

/** Turns a GA4 runReport response into rows keyed by dimension/metric name. */
export function mapGa4Rows(response: Ga4ReportResponse): Ga4Row[] {
  const dimNames = (response.dimensionHeaders ?? []).map((h) => h.name);
  const metNames = (response.metricHeaders ?? []).map((h) => h.name);
  return (response.rows ?? []).map((row) => {
    const dim: Record<string, string> = {};
    const met: Record<string, number> = {};
    dimNames.forEach((name, i) => {
      dim[name] = row.dimensionValues?.[i]?.value ?? "";
    });
    metNames.forEach((name, i) => {
      const n = Number(row.metricValues?.[i]?.value ?? 0);
      met[name] = Number.isFinite(n) ? n : 0;
    });
    return { dim, met };
  });
}

export function sumMetric(rows: Ga4Row[], metric: string): number {
  return rows.reduce((total, r) => total + (r.met[metric] ?? 0), 0);
}

const NOT_SET = new Set(["", "(not set)"]);
/** GA4 reports a custom dimension with no value as "(not set)". */
export function isNotSet(value: string | undefined): boolean {
  return NOT_SET.has(value ?? "");
}

// ---------------------------------------------------------------------------
// WhatsApp conversion
// ---------------------------------------------------------------------------

/**
 * Canonical WhatsApp Conversion Rate: sessions containing at least one
 * whatsapp_click divided by total sessions (0–1, or null when there are no
 * sessions). NEVER eventCount/sessions (a visit can click several times) and
 * never GA4's sessionKeyEventRate (not retroactive). When the numerator comes
 * from a split query it can exceed the denominator (one visit can carry two
 * attributions), so the rate is capped at 100%.
 */
export function waConversionRate(sessionsWithWhatsapp: number, sessions: number): number | null {
  if (!(sessions > 0)) return null;
  return Math.min(1, Math.max(0, sessionsWithWhatsapp) / sessions);
}

// ---------------------------------------------------------------------------
// Acquisition
// ---------------------------------------------------------------------------

export interface AcquisitionRow {
  sourceMedium: string;
  campaign: string;
  users: number;
  sessions: number;
  vehicleViews: number;
  whatsappClicks: number;
  waSessions: number;
  conversionRate: number | null;
}

const keyOf = (sourceMedium: string, campaign: string) => `${sourceMedium}\u0000${campaign}`;

/**
 * Merges the four compatible GA4 queries by (source/medium, campaign):
 *   base  sessions + activeUsers
 *   waSessions  sessions filtered to whatsapp_click
 *   views  eventCount filtered to view_item   (itemsViewed cannot be split by source)
 *   clicks eventCount filtered to whatsapp_click
 * A merge key present only in a secondary query is ignored (never invents a row).
 */
export function buildAcquisition(
  base: Ga4Row[],
  waSessions: Ga4Row[],
  views: Ga4Row[],
  clicks: Ga4Row[],
  limit = 25
): AcquisitionRow[] {
  const pick = (rows: Ga4Row[], metric: string) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = keyOf(r.dim.sessionSourceMedium ?? "", r.dim.sessionCampaignName ?? "");
      m.set(k, (m.get(k) ?? 0) + (r.met[metric] ?? 0));
    }
    return m;
  };
  const wa = pick(waSessions, "sessions");
  const v = pick(views, "eventCount");
  const c = pick(clicks, "eventCount");
  return base
    .map((r): AcquisitionRow => {
      const sourceMedium = r.dim.sessionSourceMedium ?? "";
      const campaign = r.dim.sessionCampaignName ?? "";
      const k = keyOf(sourceMedium, campaign);
      const sessions = r.met.sessions ?? 0;
      const waS = wa.get(k) ?? 0;
      return {
        sourceMedium: sourceMedium || "(not set)",
        campaign: campaign || "(not set)",
        users: r.met.activeUsers ?? 0,
        sessions,
        vehicleViews: v.get(k) ?? 0,
        whatsappClicks: c.get(k) ?? 0,
        waSessions: waS,
        conversionRate: waConversionRate(waS, sessions),
      };
    })
    .sort((a, b) => b.sessions - a.sessions || a.sourceMedium.localeCompare(b.sourceMedium))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Inventory join
// ---------------------------------------------------------------------------

export interface VehicleRef {
  stockNumber: string;
  label: string;
  status: string;
  /** Jakarta calendar date (YYYY-MM-DD) the vehicle row was created. */
  createdDate: string;
  /** Public cover (primary) photo URL; null when the vehicle has none. */
  imageUrl?: string | null;
}

export interface ItemDayRow {
  /** YYYY-MM-DD (Jakarta, from the GA4 date dimension). */
  date: string;
  itemId: string;
  value: number;
}

export interface VehiclePerformance extends VehicleRef {
  views: number;
  /** null when per-unit click data is not available yet. */
  clicks: number | null;
  /** clicks ÷ views (not session-matched); null when clicks unavailable or views = 0. */
  clicksPerView: number | null;
}

export interface InventoryJoinResult {
  rows: VehiclePerformance[];
  /** Analytics item ids with no inventory row (shown only in a warning). */
  orphans: Array<{ itemId: string; views: number; clicks: number }>;
  /** Analytics values ignored because they predate the vehicle's created_at. */
  droppedBeforeCreated: { views: number; clicks: number };
  clicksAvailable: boolean;
}

/**
 * Joins GA4 item rows to inventory on item_id = vehicles.stock_number with the
 * historical safeguard: analytics dated before the vehicle's created_at (Jakarta
 * date) are ignored, so a number that was ever reissued cannot inherit history.
 * `clickRows` null means per-unit click data is unavailable (processing).
 */
export function joinVehicles(
  viewRows: ItemDayRow[],
  clickRows: ItemDayRow[] | null,
  vehicles: VehicleRef[]
): InventoryJoinResult {
  const byStock = new Map(vehicles.map((v) => [v.stockNumber, v]));
  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  const orphans = new Map<string, { itemId: string; views: number; clicks: number }>();
  const dropped = { views: 0, clicks: 0 };

  const apply = (rows: ItemDayRow[], kind: "views" | "clicks") => {
    for (const r of rows) {
      if (isNotSet(r.itemId)) continue;
      const vehicle = byStock.get(r.itemId);
      if (!vehicle) {
        const o = orphans.get(r.itemId) ?? { itemId: r.itemId, views: 0, clicks: 0 };
        o[kind] += r.value;
        orphans.set(r.itemId, o);
        continue;
      }
      if (r.date < vehicle.createdDate) {
        dropped[kind] += r.value;
        continue;
      }
      const target = kind === "views" ? views : clicks;
      target.set(r.itemId, (target.get(r.itemId) ?? 0) + r.value);
    }
  };
  apply(viewRows, "views");
  if (clickRows) apply(clickRows, "clicks");

  const rows = vehicles
    .map((v): VehiclePerformance => {
      const vw = views.get(v.stockNumber) ?? 0;
      const ck = clickRows ? (clicks.get(v.stockNumber) ?? 0) : null;
      return { ...v, views: vw, clicks: ck, clicksPerView: ck !== null && vw > 0 ? ck / vw : null };
    })
    .sort((a, b) => b.views - a.views || (b.clicks ?? 0) - (a.clicks ?? 0) || a.stockNumber.localeCompare(b.stockNumber));

  return {
    rows,
    orphans: [...orphans.values()].sort((a, b) => b.views - a.views),
    droppedBeforeCreated: dropped,
    clicksAvailable: clickRows !== null,
  };
}

/** True when a custom-dimension query returned no real values (only "(not set)"), i.e. Google has not populated it yet. */
export function customDimensionPending(rows: Ga4Row[], dimension: string): boolean {
  return !rows.some((r) => !isNotSet(r.dim[dimension]) && (r.met.eventCount ?? 0) > 0);
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

export const CTA_LOCATIONS = [
  "header",
  "mobile_menu",
  "hero",
  "vehicle_card",
  "catalogue_empty_state",
  "payment_section",
  "detail_inline",
  "detail_sticky",
  "detail_reserved",
  "sell_form",
  "footer",
] as const;

export interface CtaRow {
  location: string;
  clicks: number;
  /** Share of ALL WhatsApp clicks in the period (including unclassified). */
  share: number;
  canonical: boolean;
}

export interface CtaResult {
  rows: CtaRow[];
  /** Clicks without a cta_location value (sent before the dimension was registered). */
  unclassified: number;
  total: number;
}

/**
 * Aggregates whatsapp_click by cta_location. Every canonical location is listed
 * (zero when unused); an unexpected value is kept and flagged non-canonical; clicks
 * with no value are reported as unclassified, never redistributed. No per-CTA
 * conversion rate exists (there is no impression denominator).
 */
export function aggregateCta(rows: Ga4Row[]): CtaResult {
  const counts = new Map<string, number>();
  let unclassified = 0;
  for (const r of rows) {
    const clicks = r.met.eventCount ?? 0;
    const loc = r.dim["customEvent:cta_location"];
    if (isNotSet(loc)) unclassified += clicks;
    else counts.set(loc, (counts.get(loc) ?? 0) + clicks);
  }
  const total = unclassified + [...counts.values()].reduce((a, b) => a + b, 0);
  const canonical: string[] = [...CTA_LOCATIONS];
  const locations = [...canonical, ...[...counts.keys()].filter((k) => !canonical.includes(k)).sort()];
  const out = locations
    .map((location): CtaRow => {
      const clicks = counts.get(location) ?? 0;
      return { location, clicks, share: total > 0 ? clicks / total : 0, canonical: canonical.includes(location) };
    })
    .sort((a, b) => b.clicks - a.clicks || canonical.indexOf(a.location) - canonical.indexOf(b.location));
  return { rows: out, unclassified, total };
}

// ---------------------------------------------------------------------------
// Search Console
// ---------------------------------------------------------------------------

export interface SearchApiResponse {
  rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
}

export interface SearchRow {
  key: string;
  clicks: number;
  impressions: number;
  /** 0–1 as returned by the API. */
  ctr: number;
  position: number;
}

export function mapSearchRows(response: SearchApiResponse): SearchRow[] {
  return (response.rows ?? []).map((r) => ({
    key: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

export interface SearchTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** Totals from the dimension-less query (the API aggregates CTR and position itself; they are never recomputed). `null` when Google returned no rows. */
export function searchTotals(response: SearchApiResponse): SearchTotals | null {
  const r = response.rows?.[0];
  if (!r) return null;
  return { clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: r.ctr ?? 0, position: r.position ?? 0 };
}

// ---------------------------------------------------------------------------
// Overview helpers
// ---------------------------------------------------------------------------

export interface TrendPoint {
  date: string;
  sessions: number;
  whatsappClicks: number;
}

/** One point per day of the range, zero-filled, from the two daily GA4 queries. */
export function buildTrend(dates: string[], traffic: Array<{ date: string; sessions: number }>, clicks: Array<{ date: string; clicks: number }>): TrendPoint[] {
  const s = new Map(traffic.map((t) => [t.date, t.sessions]));
  const c = new Map(clicks.map((t) => [t.date, t.clicks]));
  return dates.map((date) => ({ date, sessions: s.get(date) ?? 0, whatsappClicks: c.get(date) ?? 0 }));
}
