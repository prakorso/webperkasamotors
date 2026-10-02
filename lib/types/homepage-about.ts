/**
 * Homepage "Tentang Perkasa Motors" block - backed by the homepage_about_*
 * columns on website_settings (supabase/migrations/20261002010000_homepage_about_section.sql,
 * PREPARED, applied only after Owner authorization). Deliberately separate
 * from the legacy about_* columns (the old standalone About block, whose
 * stored copy contains unsupported claims and stays dormant).
 */
export interface HomepageAbout {
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  points: [string | null, string | null, string | null];
  isActive: boolean;
}

/** Admin view: the stored values plus whether the migration has been applied (admin edits are disabled until it is). */
export interface HomepageAboutAdminState {
  about: HomepageAbout;
  schemaReady: boolean;
}

/**
 * One real photo in the homepage About "proof" area - backed by the
 * homepage_about_media table (supabase/migrations/20261003010000_homepage_about_media.sql,
 * PREPARED, applied only after Owner authorization). The file lives in the
 * existing public site-assets bucket. Only REAL Perkasa Motors photos belong
 * here (customer handovers, transactions, showroom moments); there is no
 * fallback or placeholder content.
 */
export interface AboutMedia {
  id: string;
  url: string;
  storagePath: string;
  caption: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** Admin view: the items plus whether the table exists yet (the manager is disabled until it does). */
export interface AboutMediaAdminState {
  items: AboutMedia[];
  schemaReady: boolean;
}
