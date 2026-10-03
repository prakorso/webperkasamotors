/**
 * The single public origin used for every absolute URL the site emits:
 * metadataBase, canonical tags, Open Graph URLs, robots.txt and the
 * sitemap. NEXT_PUBLIC_SITE_URL (set in Netlify production) wins; the
 * fallback is the canonical production domain itself, so a deploy
 * preview, branch deploy or local build that lacks the variable still
 * canonicalizes to production instead of to its own throwaway host.
 */
export const CANONICAL_ORIGIN = "https://perkasamotors.id";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || CANONICAL_ORIGIN).replace(/\/+$/, "");

/** Absolute URL for a site path ("/" maps to the bare origin). */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Self-canonical for a ?page=N listing: page 1 is the bare path, later pages keep their own page param. */
export function paginatedCanonical(path: string, page: number): string {
  return page > 1 ? `${absoluteUrl(path)}?page=${page}` : absoluteUrl(path);
}
