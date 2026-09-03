import type { Metadata } from "next";
import { VehicleCatalogue } from "@/components/public/vehicle-catalogue";
import { getVehiclesByTypePaginated, getVehicleMedia } from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { vehicleWhatsAppConfig } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Beli Motor",
  description: "Browse Perkasa Motors' curated collection of premium motorcycles.",
};

export default async function MotorcyclesPage(props: PageProps<"/motorcycles">) {
  const searchParams = await props.searchParams;
  const requestedPage = Number(searchParams?.page) || 1;

  const [{ vehicles, page, totalPages }, settings] = await Promise.all([
    getVehiclesByTypePaginated("MOTORCYCLE", requestedPage),
    getWebsiteSettings(),
  ]);
  const mediaEntries = await Promise.all(
    vehicles.map(async (v) => [v.id, (await getVehicleMedia(v.id)).find((m) => m.isPrimary)] as const)
  );

  return (
    <VehicleCatalogue
      title="Koleksi Motor"
      description="Setiap unit telah melalui kurasi dan inspeksi internal Perkasa Motors."
      vehicles={vehicles}
      mediaByVehicleId={Object.fromEntries(mediaEntries)}
      page={page}
      totalPages={totalPages}
      basePath="/motorcycles"
      whatsapp={vehicleWhatsAppConfig(settings)}
    />
  );
}
