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
