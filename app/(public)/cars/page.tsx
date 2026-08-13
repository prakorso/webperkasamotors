import type { Metadata } from "next";
import { VehicleCatalogue } from "@/components/public/vehicle-catalogue";
import { getVehiclesByType, getVehicleMedia } from "@/lib/data/vehicles";

export const metadata: Metadata = {
  title: "Beli Mobil",
  description: "Browse Perkasa Motors' curated collection of premium cars.",
};

export default async function CarsPage() {
  const vehicles = await getVehiclesByType("CAR");
  const mediaEntries = await Promise.all(
    vehicles.map(async (v) => [v.id, (await getVehicleMedia(v.id)).find((m) => m.isPrimary)] as const)
  );

  return (
    <VehicleCatalogue
      title="Koleksi Mobil"
      description="Setiap unit telah melalui kurasi dan inspeksi internal Perkasa Motors."
      vehicles={vehicles}
      mediaByVehicleId={Object.fromEntries(mediaEntries)}
    />
  );
}
