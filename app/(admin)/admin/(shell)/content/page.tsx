import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ContentTable } from "@/components/admin/content-table";
import { getAllContentForAdmin } from "@/lib/data/social-content";
import { getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Content" };

/**
 * DORMANT (Phase 2R.5): not linked from the admin navigation. The public
 * site no longer shows social content and the per-vehicle editor was
 * removed from the Inventory page, so this is kept only as a read/clean-up
 * view of the stored items - there is no way to add new ones from the UI.
 */
export default async function AdminContentPage() {
  const [items, vehicles] = await Promise.all([getAllContentForAdmin(), getAllVehiclesForAdmin()]);
  const vehicleTitles = Object.fromEntries(vehicles.map((v) => [v.id, vehicleTitle(v)]));

  return (
    <div>
      <PageHeader
        title="Content (arsip)"
        description={`${items.length} item tersimpan. Situs tidak lagi menampilkan konten sosial; halaman ini hanya arsip.`}
      />
      {items.length === 0 ? (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-body text-[13px] text-muted-2">
            Tidak ada konten tersimpan.
          </p>
        </div>
      ) : (
        <ContentTable items={items} vehicleTitles={vehicleTitles} />
      )}
    </div>
  );
}
