/**
 * Why Perkasa benefit card — backed by the `homepage_benefits` table
 * (supabase/migrations/20260815040000_homepage_cms.sql). A genuine
 * one-to-many list (unlike Hero/About/Why Perkasa's own section header,
 * which are singleton fields on website_settings), so it gets its own
 * table and its own CRUD Server Actions (lib/actions/homepage-benefits.ts).
 */
export interface HomepageBenefit {
  id: string;
  title: string;
  description: string;
  /** Key into lib/utils/benefit-icons.ts's BENEFIT_ICON_OPTIONS — never a free-form image/SVG upload, keeps the CMS non-technical. */
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}
