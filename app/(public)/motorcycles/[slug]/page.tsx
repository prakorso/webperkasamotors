import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleDetail } from "@/components/public/vehicle-detail";
import {
  getVehicleBySlug,
  getVehicleMedia,
  getRelatedVehicles,
} from "@/lib/data/vehicles";
import { getSocialContentForVehicle } from "@/lib/data/social-content";
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
  if (!vehicle || vehicle.vehicleType !== "MOTORCYCLE") notFound();

  const [media, related, socialContent] = await Promise.all([
    getVehicleMedia(vehicle.id),
    getRelatedVehicles(vehicle),
    getSocialContentForVehicle(vehicle.id),
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
    />
  );
}
