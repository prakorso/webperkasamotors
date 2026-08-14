import type { MetadataRoute } from "next";

// See app/layout.tsx for why this fallback is the production URL, not localhost.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webperkasamotors.netlify.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
