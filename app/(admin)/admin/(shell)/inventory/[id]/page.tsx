import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { VehicleMediaManager } from "@/components/admin/vehicle-media-manager";
import { getVehicleByIdForAdmin, getVehicleMediaForAdmin } from "@/lib/data/vehicles";
import { vehicleTitle } from "@/lib/utils/format";

export async function generateMetadata(
  props: PageProps<"/admin/inventory/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const vehicle = await getVehicleByIdForAdmin(id);
  return { title: vehicle ? vehicleTitle(vehicle) : "Edit Vehicle" };
}

export default async function EditVehiclePage(props: PageProps<"/admin/inventory/[id]">) {
  const { id } = await props.params;
  const vehicle = await getVehicleByIdForAdmin(id);
  if (!vehicle) notFound();

  const media = await getVehicleMediaForAdmin(vehicle.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader title={vehicleTitle(vehicle)} description={vehicle.stockNumber} />
        <VehicleForm vehicle={vehicle} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-headline-sm text-ink">Photos</h2>
        <VehicleMediaManager vehicleId={vehicle.id} initialMedia={media} />
      </div>
    </div>
  );
}
