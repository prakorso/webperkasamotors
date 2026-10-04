import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { RANGE_KEYS, type RangeKey } from "@/lib/analytics/ranges";

export const TABS = [
  { key: "overview", label: "Overview" },
  { key: "acquisition", label: "Acquisition" },
  { key: "inventory", label: "Inventory" },
  { key: "cta", label: "CTA" },
  { key: "search", label: "Search" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

export function parseTab(value: string | string[] | undefined): TabKey {
  const v = Array.isArray(value) ? value[0] : value;
  return TABS.some((t) => t.key === v) ? (v as TabKey) : "overview";
}

const href = (tab: TabKey, range: RangeKey) => `/admin/analytics?tab=${tab}&range=${range}`;
const RANGE_LABEL: Record<RangeKey, string> = { "7d": "7 hari", "30d": "30 hari", "90d": "90 hari" };

/** Server-rendered tab + range navigation: plain links, so state lives in the URL and survives refresh. */
export function AnalyticsControls({ tab, range }: { tab: TabKey; range: RangeKey }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border md:flex-row md:items-end md:justify-between">
      <nav aria-label="Bagian analitik" className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={href(t.key, range)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 font-body text-[13px] font-medium transition-colors",
                active ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Rentang tanggal" className="flex items-center gap-1 pb-2 md:pb-3">
        <span className="mr-1 font-body text-[12px] text-muted">Periode</span>
        {RANGE_KEYS.map((r) => {
          const active = r === range;
          return (
            <Link
              key={r}
              href={href(tab, r)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "border px-3 py-1.5 font-body text-[12px] font-medium transition-colors",
                active ? "border-ink bg-ink text-paper" : "border-border bg-surface text-muted hover:border-ink hover:text-ink"
              )}
            >
              {RANGE_LABEL[r]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
