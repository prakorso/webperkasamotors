import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getAllVehicleMediaForAdmin, getAllVehiclesForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Media" };

/**
 * Library overview across every vehicle's photos, reading through
 * lib/data like every other screen. Upload/reorder/primary/delete happen
 * per-vehicle on that vehicle's Inventory edit page (Batch 3A) — that's
 * where the vehicle context already exists, so this page stays a
 * read-only overview rather than duplicating a vehicle picker here too.
 */
export default async function AdminMediaPage() {
  const [media, vehicles] = await Promise.all([
    getAllVehicleMediaForAdmin(),
    getAllVehiclesForAdmin(),
  ]);
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  return (
    <div>
      <PageHeader
        title="Media Library"
        description={`${media.length} photo${media.length === 1 ? "" : "s"} across ${vehicles.length} vehicles — click one to manage it from that vehicle's Inventory page.`}
      />

      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-surface p-10 text-center">
          <ImageOff className="text-muted" size={28} aria-hidden />
          <p className="font-body text-[13px] text-muted">No photos uploaded yet.</p>
          <p className="font-body text-[12px] text-muted-2">
            Upload from a vehicle&apos;s Inventory edit page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {media.map((item) => {
            const vehicle = vehicleById.get(item.vehicleId);
            return (
              <Link
                key={item.id}
                href={vehicle ? `/admin/inventory/${vehicle.id}` : "/admin/inventory"}
                className="group relative block aspect-square overflow-hidden border border-border bg-surface-muted"
              >
                <Image src={item.url} alt={item.altText} fill sizes="200px" className="object-cover" />
                {vehicle && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink/80 px-2 py-1 font-body text-[11px] text-paper opacity-0 transition-opacity group-hover:opacity-100">
                    {vehicleTitle(vehicle)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
