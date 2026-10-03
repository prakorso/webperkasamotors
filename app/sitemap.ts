import type { MetadataRoute } from "next";
import { getSitemapVehicles } from "@/lib/data/vehicles";
import { getSitemapArticles } from "@/lib/data/articles";
import { absoluteUrl } from "@/lib/site-url";

/**
 * lastModified is only emitted where a truthful timestamp exists: each
 * vehicle's and article's trigger-maintained updated_at. Listing pages and
 * the privacy notice have no such timestamp, so they omit it rather than
 * claiming "modified now" on every request.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicles, articles] = await Promise.all([getSitemapVehicles(), getSitemapArticles()]);

  const staticRoutes = ["/", "/cars", "/motorcycles", "/sell", "/articles", "/privacy"].map((path) => ({
    url: absoluteUrl(path),
  }));

  const vehicleRoutes = vehicles.map((v) => ({
    url: absoluteUrl(`${v.vehicleType === "CAR" ? "/cars" : "/motorcycles"}/${v.slug}`),
    lastModified: v.updatedAt,
  }));

  const articleRoutes = articles.map((a) => ({
    url: absoluteUrl(`/articles/${a.slug}`),
    lastModified: a.updatedAt,
  }));

  return [...staticRoutes, ...vehicleRoutes, ...articleRoutes];
}
