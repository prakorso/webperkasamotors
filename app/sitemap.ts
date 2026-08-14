import type { MetadataRoute } from "next";
import { getVehiclesByType } from "@/lib/data/vehicles";

// See app/layout.tsx for why this fallback is the production URL, not localhost.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webperkasamotors.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, motorcycles] = await Promise.all([
    getVehiclesByType("CAR"),
    getVehiclesByType("MOTORCYCLE"),
  ]);

  const staticRoutes = ["", "/cars", "/motorcycles", "/about", "/contact", "/financing"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })
  );

  const vehicleRoutes = [
    ...cars.map((v) => ({ url: `${siteUrl}/cars/${v.slug}`, lastModified: new Date() })),
    ...motorcycles.map((v) => ({
      url: `${siteUrl}/motorcycles/${v.slug}`,
      lastModified: new Date(),
    })),
  ];

  return [...staticRoutes, ...vehicleRoutes];
}
