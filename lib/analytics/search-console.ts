import "server-only";
import { SEARCH_CONSOLE_SCOPE, getAccessToken } from "./google-auth";
import { AnalyticsError } from "./sections";
import type { SearchApiResponse } from "./metrics";

/** Search Console Search Analytics query for the configured property. One request, no retries. */

export interface SearchRequestBody {
  startDate: string;
  endDate: string;
  dimensions?: Array<"query" | "page" | "date">;
  rowLimit?: number;
  dataState?: "final" | "all";
}

export async function runSearchQuery(label: string, body: SearchRequestBody): Promise<SearchApiResponse> {
  const site = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();
  if (!site) throw new AnalyticsError("NOT_CONFIGURED", "Properti Search Console belum dikonfigurasi di server.");
  const token = await getAccessToken(SEARCH_CONSOLE_SCOPE);
  const started = Date.now();
  let status = 0;
  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ ...body, rowLimit: Math.min(body.rowLimit ?? 25, 100) }),
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      }
    );
    status = res.status;
    if (status === 429) throw new AnalyticsError("QUOTA", "Kuota Search Console sedang penuh. Coba lagi nanti.");
    if (status === 401 || status === 403) throw new AnalyticsError("AUTH", "Akses ke Search Console ditolak.");
    if (!res.ok) throw new AnalyticsError("API", "Search Console mengembalikan kesalahan.");
    const json = (await res.json()) as SearchApiResponse;
    console.info("[analytics] search-console", { label, status, rows: json.rows?.length ?? 0, ms: Date.now() - started });
    return json;
  } catch (e) {
    if (e instanceof AnalyticsError) {
      console.warn("[analytics] search-console failed", { label, status, code: e.code, ms: Date.now() - started });
      throw e;
    }
    console.warn("[analytics] search-console failed", { label, status, code: "TIMEOUT", ms: Date.now() - started });
    throw new AnalyticsError("TIMEOUT", "Search Console tidak merespons. Coba lagi beberapa saat lagi.");
  }
}
