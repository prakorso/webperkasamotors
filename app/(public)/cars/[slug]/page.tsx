import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { VehicleDetail } from "@/components/public/vehicle-detail";
import {
  getVehicleBySlug,
  getVehicleMedia,
  getRelatedVehicles,
  getVehicleRedirectTarget,
} from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { vehicleWhatsAppConfig } from "@/lib/utils/whatsapp";
import { vehicleTitle, formatIDR } from "@/lib/utils/format";

// See app/layout.tsx for why this fallback is the production URL, not localhost.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webperkasamotors.netlify.app";

/**
 * Automatic by default, per vehicle — seoTitle/seoDescription (existing
 * columns, no CMS UI to edit them today — see components/admin/
 * vehicle-form.tsx) still override when set, so that mechanism isn't
 * lost, but no admin has to fill anything in for correct metadata to go
 * out. OG image is the vehicle's own primary photo; there is no
 * "curated and inspected" copy here anymore — Perkasa Motors doesn't
 * inspect every unit, so the claim wasn't supported by real data.
 */
export async function generateMetadata(
  props: PageProps<"/cars/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return {};

  const title = vehicle.seoTitle ?? `${vehicleTitle(vehicle)} (${vehicle.year})`;
  const description =
    vehicle.seoDescription ?? `${vehicleTitle(vehicle)} (${vehicle.year}) — ${formatIDR(vehicle.price)} di Perkasa Motors.`;
  const canonicalUrl = `${siteUrl}/cars/${vehicle.slug}`;
  const media = await getVehicleMedia(vehicle.id);
  const ogImage = media.find((m) => m.isPrimary)?.url ?? media[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function CarDetailPage(props: PageProps<"/cars/[slug]">) {
  const { slug } = await props.params;
  const vehicle = await getVehicleBySlug(slug);

  // Miss, or this exact slug now belongs to a vehicle of a different
  // type — either way, check whether (CAR, slug) matches a vehicle's
  // *previous* identity before giving up. Covers both a rename (slug
  // text changed) and a type change (this vehicle used to be a Car at
  // this same slug, and now isn't).
  if (!vehicle || vehicle.vehicleType !== "CAR") {
    const redirectTarget = await getVehicleRedirectTarget("CAR", slug);
    if (redirectTarget) {
      const path = redirectTarget.vehicleType === "CAR" ? "/cars" : "/motorcycles";
      permanentRedirect(`${path}/${redirectTarget.slug}`);
    }
    notFound();
  }

  const [media, related, settings] = await Promise.all([
    getVehicleMedia(vehicle.id),
    getRelatedVehicles(vehicle),
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
      whatsapp={vehicleWhatsAppConfig(settings)}
    />
  );
}
