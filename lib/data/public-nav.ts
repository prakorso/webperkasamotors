import "server-only";
import type { NavigationItem } from "@/lib/types";
import { isRetiredPublicHref } from "@/lib/utils/retired-routes";
import { getPublishedArticleCount } from "./articles";

/** Articles appear in public navigation only once there is meaningful content (Product spec: >= 3 published). */
export const ARTICLES_NAV_MIN_PUBLISHED = 3;

/** Label of the single header WhatsApp call-to-action (the old "Hubungi Kami" page link is retired). */
export const WHATSAPP_CTA_LABEL = "Chat WhatsApp";

const CORE_LINKS = [
  { href: "/cars", label: "Beli Mobil" },
  { href: "/motorcycles", label: "Beli Motor" },
] as const;

/** Public sell-vehicle entry (/sell). Placed directly after the catalogue links, before CMS extras such as Artikel. */
const SELL_LINK = { href: "/sell", label: "Jual Kendaraan" } as const;

/**
 * Public presentation rules applied on top of the CMS-driven navigation
 * (navigation_items), without writing to the CMS:
 *  - links to retired pages (/about, /financing, /contact) are hidden;
 *  - Articles links are hidden until ARTICLES_NAV_MIN_PUBLISHED articles are
 *    published (the routes, admin editor and tables are untouched).
 * Fails open to "hidden" if the article count cannot be read.
 */
export async function getPublicNavRules(): Promise<{ showArticles: boolean }> {
  try {
    return { showArticles: (await getPublishedArticleCount()) >= ARTICLES_NAV_MIN_PUBLISHED };
  } catch {
    return { showArticles: false };
  }
}

function isArticlesHref(href: string): boolean {
  return href === "/articles" || href.startsWith("/articles/");
}

export function applyPublicNavRules(
  items: NavigationItem[],
  rules: { showArticles: boolean }
): NavigationItem[] {
  return items.filter((item) => !isRetiredPublicHref(item.href) && (rules.showArticles || !isArticlesHref(item.href)));
}

/** Guarantees Beli Mobil / Beli Motor / Jual Kendaraan are present (in that order, ahead of other links) even if the CMS rows were removed. */
export function withCoreLinks(items: NavigationItem[], placement: NavigationItem["placement"], groupLabel: string | null): NavigationItem[] {
  const toItem = (core: { href: string; label: string }, sortOrder: number): NavigationItem => ({
    id: `core-${core.href}`,
    placement,
    groupLabel,
    label: core.label,
    href: core.href,
    sortOrder,
    isVisible: true,
    isExternal: false,
    isCta: false,
  });
  const missing = CORE_LINKS.filter((core) => !items.some((item) => item.href === core.href)).map((core, i) =>
    toItem(core, -10 + i)
  );
  const withCatalogue = [...missing, ...items];
  if (withCatalogue.some((item) => item.href === SELL_LINK.href)) return withCatalogue;

  // Insert after the last catalogue link so the order stays Beli Mobil, Beli Motor, Jual Kendaraan, then the rest.
  const lastCatalogue = withCatalogue.reduce(
    (last, item, i) => (CORE_LINKS.some((core) => core.href === item.href) ? i : last),
    -1
  );
  const sell = toItem(SELL_LINK, -8);
  return [...withCatalogue.slice(0, lastCatalogue + 1), sell, ...withCatalogue.slice(lastCatalogue + 1)];
}
