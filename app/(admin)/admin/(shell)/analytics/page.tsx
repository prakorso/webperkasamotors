import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { AnalyticsControls, parseTab, type TabKey } from "@/components/admin/analytics/controls";
import { TabSkeleton } from "@/components/admin/analytics/skeletons";
import { AcquisitionView, CtaView, InventoryView, OverviewView, SearchView } from "@/components/admin/analytics/views";
import {
  loadAcquisition,
  loadCta,
  loadInventory,
  loadOverview,
  loadSearch,
  loadVehicleRefs,
} from "@/lib/analytics/marketing-analytics";
import { parseRange, type RangeKey } from "@/lib/analytics/ranges";

export const metadata: Metadata = { title: "Marketing Analytics" };

/**
 * Marketing Analytics V1 — read-only. Lives under the admin shell layout, which
 * already requires a signed-in, active staff profile (proxy.ts also redirects
 * signed-out requests), so there is no route-level auth to add and no API route
 * exposing Google data. Only the visible tab's data is fetched; each tab sits in
 * its own Suspense boundary and every loader returns an isolated per-source state,
 * so a Google failure never blanks the rest of the module.
 */
export default async function AnalyticsPage(props: PageProps<"/admin/analytics">) {
  const searchParams = await props.searchParams;
  const tab = parseTab(searchParams?.tab);
  const range = parseRange(searchParams?.range);

  return (
    <div>
      <PageHeader title="Marketing Analytics" description="Trafik, minat unit, dan niat WhatsApp. Hanya baca; data dari GA4 dan Search Console." />
      <AnalyticsControls tab={tab} range={range} />
      <Suspense key={`${tab}-${range}`} fallback={<TabSkeleton kpis={tab === "overview"} />}>
        <TabContent tab={tab} range={range} />
      </Suspense>
    </div>
  );
}

const vehicleRefs = cache(loadVehicleRefs);

async function TabContent({ tab, range }: { tab: TabKey; range: RangeKey }) {
  switch (tab) {
    case "overview":
      return <OverviewView section={await loadOverview(range, vehicleRefs)} />;
    case "acquisition":
      return <AcquisitionView section={await loadAcquisition(range)} />;
    case "inventory":
      return <InventoryView section={await loadInventory(range, vehicleRefs)} />;
    case "cta":
      return <CtaView section={await loadCta(range)} />;
    case "search":
      return <SearchView section={await loadSearch(range)} />;
  }
}
