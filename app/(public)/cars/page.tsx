import type { Metadata } from "next";
import { cache } from "react";
import { paginatedCanonical } from "@/lib/site-url";
import { VehicleCatalogue } from "@/components/public/vehicle-catalogue";
import { getCatalogueByType, getVehicleMedia } from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { vehicleWhatsAppConfig } from "@/lib/utils/whatsapp";

// Shared by generateMetadata and the page so the canonical names the page actually rendered (out-of-range ?page= is clamped).
const loadCatalogue = cache((page: number) => getCatalogueByType("CAR", page));

export async function generateMetadata(props: PageProps<"/cars">): Promise<Metadata> {
  const { active } = await loadCatalogue(Number((await props.searchParams)?.page) || 1);
  return {
    title: "Beli Mobil",
    description: "Pilihan mobil yang tersedia di Perkasa Motors.",
    alternates: { canonical: paginatedCanonical("/cars", active.page) },
  };
}

export default async function CarsPage(props: PageProps<"/cars">) {
  const searchParams = await props.searchParams;
  const requestedPage = Number(searchParams?.page) || 1;

  const [{ active, sold }, settings] = await Promise.all([
    loadCatalogue(requestedPage),
    getWebsiteSettings(),
  ]);
  const { vehicles, page, totalPages } = active;
  const mediaEntries = await Promise.all(
    [...vehicles, ...sold].map(async (v) => [v.id, (await getVehicleMedia(v.id)).find((m) => m.isPrimary)] as const)
  );

  return (
    <VehicleCatalogue
      title="Koleksi Mobil"
      description="Pilihan mobil yang tersedia di Perkasa Motors."
      vehicles={vehicles}
      soldVehicles={sold}
      mediaByVehicleId={Object.fromEntries(mediaEntries)}
      page={page}
      totalPages={totalPages}
      basePath="/cars"
      whatsapp={vehicleWhatsAppConfig(settings)}
    />
  );
}
