import type { NavigationItem } from "./navigation";

export interface FooterNavGroup {
  groupLabel: string | null;
  items: NavigationItem[];
}

/**
 * Composed from WebsiteSettings + NavigationItem — the footer has no
 * table of its own. See lib/data/footer.ts.
 */
export interface FooterSettings {
  companyName: string;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  copyrightText: string;
  /** Generic WhatsApp message template — used to pre-fill the footer's WhatsApp link, same value the rest of the site's generic CTAs use. */
  whatsappGenericTemplate: string | null;
  navGroups: FooterNavGroup[];
  legalLinks: NavigationItem[];
}
