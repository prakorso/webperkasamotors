import type { Metadata } from "next";
import { cache } from "react";
import { paginatedCanonical } from "@/lib/site-url";
import { VehicleCatalogue } from "@/components/public/vehicle-catalogue";
import { getCatalogueByType, getVehicleMedia } from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { vehicleWhatsAppConfig } from "@/lib/utils/whatsapp";

// Shared by generateMetadata and the page so the canonical names the page actually rendered (out-of-range ?page= is clamped).
const loadCatalogue = cache((page: number) => getCatalogueByType("MOTORCYCLE", page));

export async function generateMetadata(props: PageProps<"/motorcycles">): Promise<Metadata> {
  const { active } = await loadCatalogue(Number((await props.searchParams)?.page) || 1);
  return {
    title: "Beli Motor",
    description: "Pilihan motor yang tersedia di Perkasa Motors.",
    alternates: { canonical: paginatedCanonical("/motorcycles", active.page) },
  };
}

export default async function MotorcyclesPage(props: PageProps<"/motorcycles">) {
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
      title="Koleksi Motor"
      description="Pilihan motor yang tersedia di Perkasa Motors."
      vehicles={vehicles}
      soldVehicles={sold}
      mediaByVehicleId={Object.fromEntries(mediaEntries)}
      page={page}
      totalPages={totalPages}
      basePath="/motorcycles"
      whatsapp={vehicleWhatsAppConfig(settings)}
    />
  );
}
