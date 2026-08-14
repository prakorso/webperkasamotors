/**
 * Serves both the header nav and the footer (nav groups + legal links),
 * distinguished by `placement` — see lib/data/navigation.ts.
 */
export type NavPlacement = "HEADER" | "FOOTER_NAV" | "FOOTER_LEGAL";

export interface NavigationItem {
  id: string;
  placement: NavPlacement;
  /** Footer nav groups only (e.g. "Navigasi"); null for HEADER and FOOTER_LEGAL. */
  groupLabel: string | null;
  label: string;
  href: string;
  sortOrder: number;
  isVisible: boolean;
  isExternal: boolean;
  /** Renders as the styled CTA button instead of a plain link — header-only in practice. */
  isCta: boolean;
}
