import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { VehicleDetail } from "@/components/public/vehicle-detail";
import {
  getVehicleBySlug,
  getVehicleMedia,
  getRelatedVehicles,
  getVehicleRedirectTarget,
} from "@/lib/data/vehicles";
import { getSocialContentForVehicle } from "@/lib/data/social-content";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { vehicleWhatsAppConfig } from "@/lib/utils/whatsapp";
import { vehicleTitle, formatIDR } from "@/lib/utils/format";

export async function generateMetadata(
  props: PageProps<"/motorcycles/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return {};

  return {
    title: vehicle.seoTitle ?? `${vehicleTitle(vehicle)} (${vehicle.year})`,
    description:
      vehicle.seoDescription ??
      `${vehicleTitle(vehicle)} — ${formatIDR(vehicle.price)}. Curated and inspected by Perkasa Motors.`,
  };
}

export default async function MotorcycleDetailPage(
  props: PageProps<"/motorcycles/[slug]">
) {
  const { slug } = await props.params;
  const vehicle = await getVehicleBySlug(slug);

  // Miss, or this exact slug now belongs to a vehicle of a different
  // type — check whether (MOTORCYCLE, slug) matches a vehicle's
  // *previous* identity before giving up. Covers both a rename and a
  // type change.
  if (!vehicle || vehicle.vehicleType !== "MOTORCYCLE") {
    const redirectTarget = await getVehicleRedirectTarget("MOTORCYCLE", slug);
    if (redirectTarget) {
      const path = redirectTarget.vehicleType === "CAR" ? "/cars" : "/motorcycles";
      permanentRedirect(`${path}/${redirectTarget.slug}`);
    }
    notFound();
  }

  const [media, related, socialContent, settings] = await Promise.all([
    getVehicleMedia(vehicle.id),
    getRelatedVehicles(vehicle),
    getSocialContentForVehicle(vehicle.id),
    getWebsiteSettings(),
  ]);
  const relatedWithMedia = await Promise.all(
    related.map(async (v) => ({
      vehicle: v,
      primaryMedia: (await getVehicleMedia(v.id)).find((m) => m.isPrimary),
    }))
  );

  return (
    <VehicleDetail
      vehicle={vehicle}
      media={media}
      relatedVehicles={relatedWithMedia}
      socialContent={socialContent}
      whatsapp={vehicleWhatsAppConfig(settings)}
    />
  );
}
