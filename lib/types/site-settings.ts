/**
 * Singleton site-wide configuration — see lib/data/site-settings.ts for
 * the Supabase-backed implementation and docs/PHASE-2-SUPABASE-PLAN.md /
 * the Phase 2C Batch 2 chat summary for the schema.
 */
export interface WebsiteSettings {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoOgImageUrl: string | null;
  defaultCtaLabel: string | null;
  defaultCtaUrl: string | null;
  copyrightText: string;
  footerDescription: string | null;
  /** Admin-editable WhatsApp message template for the vehicle inquiry lead
   *  form. Null/empty means "use the hardcoded default" — see
   *  lib/actions/leads.ts's DEFAULT_WHATSAPP_TEMPLATE. Supports {name},
   *  {vehicle}, {company}. */
  whatsappLeadTemplate: string | null;
  /** Destination WhatsApp number for vehicle lead inquiries — distinct
   *  from `whatsapp` (the general/footer number). Null/empty falls back
   *  to `whatsapp`, so leaving this unset means General and Lead
   *  WhatsApp are the same number. */
  whatsappLeadNumber: string | null;
}
