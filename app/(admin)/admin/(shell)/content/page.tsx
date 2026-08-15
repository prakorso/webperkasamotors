import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ContentTable } from "@/components/admin/content-table";
import { getAllContentForAdmin } from "@/lib/data/social-content";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Content" };

/**
 * Content Library — browse, correct, hide, or delete anything across
 * every vehicle. Deliberately has no "Add Content" entry point: creation
 * only happens from the vehicle it belongs to
 * (components/admin/vehicle-social-content.tsx on the Inventory edit
 * page), so there's exactly one way to add content, not two.
 */
export default async function AdminContentPage() {
  const [items, vehicles] = await Promise.all([getAllContentForAdmin(), getAllVehiclesForAdmin()]);
  const vehicleTitles = Object.fromEntries(vehicles.map((v) => [v.id, vehicleTitle(v)]));

  return (
    <div>
      <PageHeader
        title="Content"
        description={`${items.length} item${items.length === 1 ? "" : "s"} — everything across every vehicle. To add new content, open the vehicle it belongs to from Inventory.`}
      />
      {items.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted-2">
            No content yet. Add a social media link from a vehicle&apos;s Inventory page — it will
            show up here too.
          </p>
        </div>
      ) : (
        <ContentTable items={items} vehicleTitles={vehicleTitles} />
      )}
    </div>
  );
}
