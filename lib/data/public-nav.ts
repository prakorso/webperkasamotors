import "server-only";
import type { NavigationItem } from "@/lib/types";
import { getPublishedArticleCount } from "./articles";

/** Articles appear in public navigation only once there is meaningful content (Product spec: >= 3 published). */
export const ARTICLES_NAV_MIN_PUBLISHED = 3;

/**
 * Public presentation rules applied on top of the CMS-driven navigation
 * (navigation_items), without writing to the CMS:
 *  - Articles links are hidden until ARTICLES_NAV_MIN_PUBLISHED articles are
 *    published (the routes, admin editor and tables are untouched).
 *  - "/financing" is labelled "Pembiayaan": the page is no longer a numeric
 *    "Simulasi Kredit" calculator. The stored CMS label is left as is and is
 *    a Phase 2R.5 content cleanup.
 * Fails open to "hidden" if the count cannot be read.
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
  return items
    .filter((item) => rules.showArticles || !isArticlesHref(item.href))
    .map((item) => (item.href === "/financing" ? { ...item, label: "Pembiayaan" } : item));
}
