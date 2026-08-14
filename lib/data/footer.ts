import "server-only";
import type { FooterSettings, NavigationItem } from "@/lib/types";
import { getWebsiteSettings } from "./site-settings";
import { getNavigationItems } from "./navigation";

/**
 * Read-only. The mutation (updateFooterSettings) lives in
 * lib/actions/footer.ts — see that file's header comment for why Server
 * Actions can't share a module with plain "server-only" reads.
 *
 * The footer has no table of its own — it's a composition of
 * website_settings (company/contact/social/copyright text) and
 * navigation_items (FOOTER_NAV grouped by group_label, FOOTER_LEGAL flat).
 */
export async function getFooterSettings(): Promise<FooterSettings> {
  const [settings, navItems, legalItems] = await Promise.all([
    getWebsiteSettings(),
    getNavigationItems("FOOTER_NAV"),
    getNavigationItems("FOOTER_LEGAL"),
  ]);

  const groups = new Map<string, NavigationItem[]>();
  for (const item of navItems) {
    const key = item.groupLabel ?? "";
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return {
    companyName: settings.companyName,
    logoUrl: settings.logoUrl,
    description: settings.footerDescription,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    tiktokUrl: settings.tiktokUrl,
    youtubeUrl: settings.youtubeUrl,
    copyrightText: settings.copyrightText,
    navGroups: Array.from(groups.entries()).map(([groupLabel, items]) => ({
      groupLabel: groupLabel || null,
      items,
    })),
    legalLinks: legalItems,
  };
}
