import "server-only";
import { unstable_cache } from "next/cache";
import { getAllVehiclesForAdmin, getVehicleActivityForAdmin } from "@/lib/data/vehicles";
import type { Vehicle } from "@/lib/types";
import { vehicleTitle } from "@/lib/utils/format";
import { runGa4Report, type Ga4RequestBody } from "./ga4";
import { runSearchQuery, type SearchRequestBody } from "./search-console";
import {
  aggregateCta,
  buildAcquisition,
  buildTrend,
  customDimensionPending,
  joinVehicles,
  mapGa4Rows,
  mapSearchRows,
  searchTotals,
  sumMetric,
  waConversionRate,
  type AcquisitionRow,
  type CtaResult,
  type Ga4Row,
  type InventoryJoinResult,
  type SearchRow,
  type SearchTotals,
  type TrendPoint,
  type VehicleRef,
} from "./metrics";
import {
  eachDate,
  ga4DateToIso,
  jakartaDate,
  resolveRange,
  resolveSearchRange,
  type DateRange,
  type RangeKey,
} from "./ranges";
import { AnalyticsError, settle, type SectionState } from "./sections";

/**
 * Marketing Analytics V1 data service (server only). Live Google API calls,
 * cached 30 minutes per (query, date window) with unstable_cache (the project
 * does not use Cache Components). Failures are never cached (a thrown error
 * is not stored) and each public loader converts them into a section state,
 * so one failing source cannot blank the others. Nothing here writes
 * anywhere and no raw events are stored.
 */

export const CACHE_SECONDS = 30 * 60;
const CACHE_TAG = "marketing-analytics";

// ---------------------------------------------------------------------------
// Centralised GA4 query definitions (all proven against the real API, see
// docs/reports/marketing-analytics-v1-phase1-api-proof.md)
// ---------------------------------------------------------------------------

type Ga4Query =
  | "totals"
  | "waSessions"
  | "waEvents"
  | "trafficDaily"
  | "waDaily"
  | "itemViews"
  | "itemClicks"
  | "acqBase"
  | "acqWaSessions"
  | "acqViews"
  | "acqClicks"
  | "ctaClicks"
  | "sellViews"
  | "sellClicks";

const exact = (fieldName: string, value: string) => ({
  filter: { fieldName, stringFilter: { matchType: "EXACT", value } },
});
const WHATSAPP = exact("eventName", "whatsapp_click");
const ACQ_DIMENSIONS = [{ name: "sessionSourceMedium" }, { name: "sessionCampaignName" }];

function ga4Body(query: Ga4Query, startDate: string, endDate: string): Ga4RequestBody {
  const dateRanges = [{ startDate, endDate }];
  switch (query) {
    case "totals":
      return { dateRanges, metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }] };
    case "waSessions": // distinct sessions containing the event (NOT eventCount)
      return { dateRanges, metrics: [{ name: "sessions" }], dimensionFilter: WHATSAPP };
    case "waEvents":
      return { dateRanges, metrics: [{ name: "eventCount" }], dimensionFilter: WHATSAPP };
    case "trafficDaily":
      return { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }] };
    case "waDaily":
      return { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "eventCount" }], dimensionFilter: WHATSAPP };
    case "itemViews": // item-scoped: never combine with session-scoped dimensions
      return { dateRanges, dimensions: [{ name: "date" }, { name: "itemId" }], metrics: [{ name: "itemsViewed" }], limit: 10_000 };
    case "itemClicks":
      return {
        dateRanges,
        dimensions: [{ name: "date" }, { name: "customEvent:item_id" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: WHATSAPP,
        limit: 10_000,
      };
    case "acqBase":
      return { dateRanges, dimensions: ACQ_DIMENSIONS, metrics: [{ name: "sessions" }, { name: "activeUsers" }], limit: 250 };
    case "acqWaSessions":
      return { dateRanges, dimensions: ACQ_DIMENSIONS, metrics: [{ name: "sessions" }], dimensionFilter: WHATSAPP, limit: 250 };
    case "acqViews": // view_item events by source (itemsViewed cannot be split by source)
      return { dateRanges, dimensions: ACQ_DIMENSIONS, metrics: [{ name: "eventCount" }], dimensionFilter: exact("eventName", "view_item"), limit: 250 };
    case "acqClicks":
      return { dateRanges, dimensions: ACQ_DIMENSIONS, metrics: [{ name: "eventCount" }], dimensionFilter: WHATSAPP, limit: 250 };
    case "ctaClicks":
      return {
        dateRanges,
        dimensions: [{ name: "customEvent:cta_location" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: WHATSAPP,
        limit: 100,
      };
    case "sellViews":
      return { dateRanges, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], dimensionFilter: exact("pagePath", "/sell") };
    case "sellClicks":
      return {
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { andGroup: { expressions: [WHATSAPP, exact("pagePath", "/sell")] } },
      };
  }
}

type Cached<T> = { rows: T; fetchedAt: string };

/** One cached GA4 query. Arguments are primitives, so they form the cache key (query + date window). */
const fetchGa4 = unstable_cache(
  async (query: Ga4Query, startDate: string, endDate: string): Promise<Cached<Ga4Row[]>> => {
    const res = await runGa4Report(query, ga4Body(query, startDate, endDate));
    return { rows: mapGa4Rows(res), fetchedAt: new Date().toISOString() };
  },
  ["marketing-analytics", "ga4"],
  { revalidate: CACHE_SECONDS, tags: [CACHE_TAG] }
);

type SearchQuery = "total" | "queries" | "pages";

function searchBody(query: SearchQuery, startDate: string, endDate: string): SearchRequestBody {
  const base = { startDate, endDate, dataState: "all" as const };
  if (query === "total") return base;
  return { ...base, dimensions: [query === "queries" ? "query" : "page"], rowLimit: 25 };
}

const fetchSearch = unstable_cache(
  async (query: SearchQuery, startDate: string, endDate: string): Promise<Cached<{ rows: SearchRow[]; totals: SearchTotals | null }>> => {
    const res = await runSearchQuery(query, searchBody(query, startDate, endDate));
    return { rows: { rows: mapSearchRows(res), totals: searchTotals(res) }, fetchedAt: new Date().toISOString() };
  },
  ["marketing-analytics", "search-console"],
  { revalidate: CACHE_SECONDS, tags: [CACHE_TAG] }
);

const oldest = (...stamps: string[]) => stamps.reduce((a, b) => (a < b ? a : b));

// ---------------------------------------------------------------------------
// Inventory references (Supabase, session client — cannot live inside a cache)
// ---------------------------------------------------------------------------

const TRACKED_STATUSES = new Set<Vehicle["status"]>(["AVAILABLE", "RESERVED", "SOLD"]);

export async function loadVehicleRefs(): Promise<VehicleRef[]> {
  try {
    const [vehicles, activity] = await Promise.all([getAllVehiclesForAdmin(), getVehicleActivityForAdmin()]);
    return vehicles
      .filter((v) => TRACKED_STATUSES.has(v.status) && activity[v.id])
      .map((v) => ({
        stockNumber: v.stockNumber,
        label: `${vehicleTitle(v)} ${v.year}`,
        status: v.status,
        createdDate: jakartaDate(new Date(activity[v.id].createdAt)),
      }));
  } catch {
    throw new AnalyticsError("API", "Data unit tidak dapat dimuat dari database.");
  }
}

// ---------------------------------------------------------------------------
// Section loaders
// ---------------------------------------------------------------------------

export interface OverviewData {
  range: DateRange;
  kpis: {
    users: number;
    sessions: number;
    pageViews: number;
    vehicleViews: number;
    whatsappClicks: number;
    waSessions: number;
    conversionRate: number | null;
  };
  topVehicle: { label: string; stockNumber: string; status: string; views: number } | null;
  topSource: { sourceMedium: string; sessions: number } | null;
  sell: { pageViews: number; whatsappClicks: number };
  trend: TrendPoint[];
}

export function loadOverview(rangeKey: RangeKey, refs: () => Promise<VehicleRef[]>): Promise<SectionState<OverviewData>> {
  return settle<OverviewData>(async () => {
    const range = resolveRange(rangeKey, new Date());
    const q = (name: Ga4Query) => fetchGa4(name, range.startDate, range.endDate);
    const [totals, waSessions, waEvents, itemViews, trafficDaily, waDaily, acq, sellViews, sellClicks] = await Promise.all([
      q("totals"), q("waSessions"), q("waEvents"), q("itemViews"), q("trafficDaily"), q("waDaily"), q("acqBase"), q("sellViews"), q("sellClicks"),
    ]);
    const stamps = [totals, waSessions, waEvents, itemViews, trafficDaily, waDaily, acq, sellViews, sellClicks].map((r) => r.fetchedAt);

    const sessions = sumMetric(totals.rows, "sessions");
    const pageViews = sumMetric(totals.rows, "screenPageViews");
    if (sessions === 0 && pageViews === 0) return { state: "empty", fetchedAt: oldest(...stamps) };

    // Top vehicle needs inventory names; if the database is unavailable the rest of the overview still works.
    let topVehicle: OverviewData["topVehicle"] = null;
    try {
      const joined = joinVehicles(
        itemViews.rows.map((r) => ({ date: ga4DateToIso(r.dim.date), itemId: r.dim.itemId, value: r.met.itemsViewed ?? 0 })),
        null,
        await refs()
      );
      const top = joined.rows.find((r) => r.views > 0);
      if (top) topVehicle = { label: top.label, stockNumber: top.stockNumber, status: top.status, views: top.views };
    } catch {
      topVehicle = null;
    }

    const bySource = new Map<string, number>();
    for (const r of acq.rows) bySource.set(r.dim.sessionSourceMedium, (bySource.get(r.dim.sessionSourceMedium) ?? 0) + (r.met.sessions ?? 0));
    const [topSourceEntry] = [...bySource.entries()].sort((a, b) => b[1] - a[1]);

    const waSessionCount = sumMetric(waSessions.rows, "sessions");
    return {
      state: "ok",
      fetchedAt: oldest(...stamps),
      data: {
        range,
        kpis: {
          users: sumMetric(totals.rows, "activeUsers"),
          sessions,
          pageViews,
          vehicleViews: sumMetric(itemViews.rows, "itemsViewed"),
          whatsappClicks: sumMetric(waEvents.rows, "eventCount"),
          waSessions: waSessionCount,
          conversionRate: waConversionRate(waSessionCount, sessions),
        },
        topVehicle,
        topSource: topSourceEntry ? { sourceMedium: topSourceEntry[0] || "(not set)", sessions: topSourceEntry[1] } : null,
        sell: { pageViews: sumMetric(sellViews.rows, "screenPageViews"), whatsappClicks: sumMetric(sellClicks.rows, "eventCount") },
        trend: buildTrend(
          eachDate(range),
          trafficDaily.rows.map((r) => ({ date: ga4DateToIso(r.dim.date), sessions: r.met.sessions ?? 0 })),
          waDaily.rows.map((r) => ({ date: ga4DateToIso(r.dim.date), clicks: r.met.eventCount ?? 0 }))
        ),
      },
    };
  });
}

export interface AcquisitionData {
  range: DateRange;
  rows: AcquisitionRow[];
}

export function loadAcquisition(rangeKey: RangeKey): Promise<SectionState<AcquisitionData>> {
  return settle<AcquisitionData>(async () => {
    const range = resolveRange(rangeKey, new Date());
    const q = (name: Ga4Query) => fetchGa4(name, range.startDate, range.endDate);
    const [base, waSessions, views, clicks] = await Promise.all([q("acqBase"), q("acqWaSessions"), q("acqViews"), q("acqClicks")]);
    const fetchedAt = oldest(base.fetchedAt, waSessions.fetchedAt, views.fetchedAt, clicks.fetchedAt);
    const rows = buildAcquisition(base.rows, waSessions.rows, views.rows, clicks.rows);
    if (rows.length === 0) return { state: "empty", fetchedAt };
    return { state: "ok", fetchedAt, data: { range, rows } };
  });
}

export type InventoryData = InventoryJoinResult & { range: DateRange };

export function loadInventory(rangeKey: RangeKey, refs: () => Promise<VehicleRef[]>): Promise<SectionState<InventoryData>> {
  return settle<InventoryData>(async () => {
    const range = resolveRange(rangeKey, new Date());
    const q = (name: Ga4Query) => fetchGa4(name, range.startDate, range.endDate);
    const vehicles = await refs();
    const views = await q("itemViews");
    // Per-unit clicks depend on the item_id custom dimension; if Google has not populated it yet, views still render.
    let clicks: Cached<Ga4Row[]> | null = null;
    try {
      clicks = await q("itemClicks");
    } catch (e) {
      if (!(e instanceof AnalyticsError && e.code === "API")) throw e;
    }
    const clicksPending = !clicks || customDimensionPending(clicks.rows, "customEvent:item_id");
    const joined = joinVehicles(
      views.rows.map((r) => ({ date: ga4DateToIso(r.dim.date), itemId: r.dim.itemId, value: r.met.itemsViewed ?? 0 })),
      clicksPending || !clicks
        ? null
        : clicks.rows.map((r) => ({ date: ga4DateToIso(r.dim.date), itemId: r.dim["customEvent:item_id"], value: r.met.eventCount ?? 0 })),
      vehicles
    );
    const fetchedAt = oldest(views.fetchedAt, clicks?.fetchedAt ?? views.fetchedAt);
    if (vehicles.length === 0) return { state: "empty", fetchedAt };
    const data = { ...joined, range };
    return clicksPending
      ? { state: "processing", reason: "Data klik per unit sedang diproses Google. Data view unit tetap tersedia.", fetchedAt, data }
      : { state: "ok", fetchedAt, data };
  });
}

export interface CtaData extends CtaResult {
  range: DateRange;
}

export function loadCta(rangeKey: RangeKey): Promise<SectionState<CtaData>> {
  return settle<CtaData>(async () => {
    const range = resolveRange(rangeKey, new Date());
    let res: Cached<Ga4Row[]>;
    try {
      res = await fetchGa4("ctaClicks", range.startDate, range.endDate);
    } catch (e) {
      if (e instanceof AnalyticsError && e.code === "API") {
        return { state: "processing", reason: "Data CTA sedang diproses Google. Coba kembali setelah data tersedia.", fetchedAt: new Date().toISOString() };
      }
      throw e;
    }
    if (customDimensionPending(res.rows, "customEvent:cta_location")) {
      return { state: "processing", reason: "Data CTA sedang diproses Google. Coba kembali setelah data tersedia.", fetchedAt: res.fetchedAt };
    }
    const cta = aggregateCta(res.rows);
    if (cta.total === 0) return { state: "empty", fetchedAt: res.fetchedAt };
    return { state: "ok", fetchedAt: res.fetchedAt, data: { ...cta, range } };
  });
}

export interface SearchData {
  /** Search Console window actually queried (Pacific-Time dates at the source, ends 3 days before today in Jakarta). */
  range: DateRange;
  totals: SearchTotals;
  queries: SearchRow[];
  pages: SearchRow[];
}

export function loadSearch(rangeKey: RangeKey): Promise<SectionState<SearchData>> {
  return settle<SearchData>(async () => {
    const range = resolveSearchRange(rangeKey, new Date());
    const q = (name: SearchQuery) => fetchSearch(name, range.startDate, range.endDate);
    const [total, queries, pages] = await Promise.all([q("total"), q("queries"), q("pages")]);
    const fetchedAt = oldest(total.fetchedAt, queries.fetchedAt, pages.fetchedAt);
    if (!total.rows.totals) {
      return { state: "processing", reason: "Data Search Console belum tersedia. Google masih memproses data situs ini.", fetchedAt };
    }
    return { state: "ok", fetchedAt, data: { range, totals: total.rows.totals, queries: queries.rows.rows, pages: pages.rows.rows } };
  });
}
