import "server-only";
import { GA4_SCOPE, getAccessToken } from "./google-auth";
import { AnalyticsError } from "./sections";
import type { Ga4ReportResponse } from "./metrics";

/** GA4 Data API (v1beta) runReport for the configured property. One request, no retries. */

export interface Ga4RequestBody {
  dateRanges: Array<{ startDate: string; endDate: string }>;
  dimensions?: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  dimensionFilter?: unknown;
  orderBys?: unknown[];
  limit?: number;
}

const MAX_ROWS = 10_000;

export async function runGa4Report(label: string, body: Ga4RequestBody): Promise<Ga4ReportResponse> {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim();
  if (!propertyId || !/^\d+$/.test(propertyId)) {
    throw new AnalyticsError("NOT_CONFIGURED", "Properti GA4 belum dikonfigurasi di server.");
  }
  const token = await getAccessToken(GA4_SCOPE);
  const started = Date.now();
  let status = 0;
  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ ...body, limit: Math.min(body.limit ?? 1000, MAX_ROWS) }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    status = res.status;
    if (status === 429) throw new AnalyticsError("QUOTA", "Kuota GA4 sedang penuh. Coba lagi nanti.");
    if (status === 401 || status === 403) throw new AnalyticsError("AUTH", "Akses ke GA4 ditolak.");
    if (!res.ok) throw new AnalyticsError("API", "GA4 mengembalikan kesalahan.");
    const json = (await res.json()) as Ga4ReportResponse;
    console.info("[analytics] ga4", { label, status, rows: json.rows?.length ?? 0, ms: Date.now() - started });
    return json;
  } catch (e) {
    if (e instanceof AnalyticsError) {
      console.warn("[analytics] ga4 failed", { label, status, code: e.code, ms: Date.now() - started });
      throw e;
    }
    console.warn("[analytics] ga4 failed", { label, status, code: "TIMEOUT", ms: Date.now() - started });
    throw new AnalyticsError("TIMEOUT", "GA4 tidak merespons. Coba lagi beberapa saat lagi.");
  }
}
