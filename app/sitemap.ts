import type { MetadataRoute } from "next";
import { getVehiclesByType } from "@/lib/data/vehicles";
import { getAllPublishedArticleSlugs } from "@/lib/data/articles";

// See app/layout.tsx for why this fallback is the production URL, not localhost.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webperkasamotors.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, motorcycles, articleSlugs] = await Promise.all([
    getVehiclesByType("CAR"),
    getVehiclesByType("MOTORCYCLE"),
    getAllPublishedArticleSlugs(),
  ]);

  const staticRoutes = [
    "",
    "/cars",
    "/motorcycles",
    "/about",
    "/contact",
    "/financing",
    "/articles",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const vehicleRoutes = [
    ...cars.map((v) => ({ url: `${siteUrl}/cars/${v.slug}`, lastModified: new Date() })),
    ...motorcycles.map((v) => ({
      url: `${siteUrl}/motorcycles/${v.slug}`,
      lastModified: new Date(),
    })),
  ];

  const articleRoutes = articleSlugs.map((slug) => ({
    url: `${siteUrl}/articles/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...vehicleRoutes, ...articleRoutes];
}
