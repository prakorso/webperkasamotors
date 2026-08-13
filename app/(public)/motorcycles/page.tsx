import type { Metadata } from "next";
import { VehicleCatalogue } from "@/components/public/vehicle-catalogue";
import { getVehiclesByType, getVehicleMedia } from "@/lib/data/vehicles";

export const metadata: Metadata = {
  title: "Beli Motor",
  description: "Browse Perkasa Motors' curated collection of premium motorcycles.",
};

export default async function MotorcyclesPage() {
  const vehicles = await getVehiclesByType("MOTORCYCLE");
  const mediaEntries = await Promise.all(
    vehicles.map(async (v) => [v.id, (await getVehicleMedia(v.id)).find((m) => m.isPrimary)] as const)
  );

  return (
    <VehicleCatalogue
      title="Koleksi Motor"
      description="Setiap unit telah melalui kurasi dan inspeksi internal Perkasa Motors."
      vehicles={vehicles}
      mediaByVehicleId={Object.fromEntries(mediaEntries)}
    />
  );
}
