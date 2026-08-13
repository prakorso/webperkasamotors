import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { getVehicleByIdForAdmin } from "@/lib/data/vehicles";
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

  return (
    <div>
      <PageHeader
        title={vehicleTitle(vehicle)}
        description={`${vehicle.stockNumber} — visual edit shell, Phase 2 connects this to Supabase.`}
      />
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
