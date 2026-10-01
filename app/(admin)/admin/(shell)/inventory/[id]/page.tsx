import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { VehicleMediaManager } from "@/components/admin/vehicle-media-manager";
import { VehicleStatusActions } from "@/components/admin/vehicle-status-actions";
import { Badge } from "@/components/ui/badge";
import { getVehicleByIdForAdmin, getVehicleMediaForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";
import { ADMIN_STATUS_VARIANT, adminStatusLabel, isLiveOnSite } from "@/lib/utils/admin-vehicle";

export async function generateMetadata(
  props: PageProps<"/admin/inventory/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const vehicle = await getVehicleByIdForAdmin(id);
  return { title: vehicle ? vehicleTitle(vehicle) : "Edit Unit" };
}

/**
 * One page per unit: status (with the quick Tayangkan / Dipesan / Terjual
 * buttons), the facts form, and the photos. The per-vehicle "Social
 * Content" editor that used to sit here was removed from the owner flow -
 * the public site no longer shows social content (its data and
 * /admin/content route are untouched).
 */
export default async function EditVehiclePage(props: PageProps<"/admin/inventory/[id]">) {
  const { id } = await props.params;
  const vehicle = await getVehicleByIdForAdmin(id);
  if (!vehicle) notFound();

  const media = await getVehicleMediaForAdmin(vehicle.id);
  const live = isLiveOnSite(vehicle);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader title={vehicleTitle(vehicle)} description={vehicle.stockNumber} />

        <section
          aria-label="Status unit"
          className="mb-6 flex flex-col gap-3 border border-border bg-surface p-5 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={ADMIN_STATUS_VARIANT[vehicle.status]}>{adminStatusLabel(vehicle.status)}</Badge>
            <span className="font-body text-[13px] text-muted">
              {live ? "Tayang di situs." : "Belum tayang di situs."}
              {!live && media.length === 0 && " Tambahkan foto lebih dulu sebelum menayangkan."}
            </span>
          </div>
          <VehicleStatusActions vehicle={vehicle} size="md" />
        </section>

        <VehicleForm vehicle={vehicle} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-headline-sm text-ink">Foto</h2>
        <VehicleMediaManager vehicleId={vehicle.id} initialMedia={media} />
      </div>
    </div>
  );
}
