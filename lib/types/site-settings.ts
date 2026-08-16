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
  /** Homepage hero — fixed 3-slide structure, see
   *  supabase/migrations/20260817010000_hero_3_slides.sql. Each slide is
   *  independently optional; a slide only participates in the public
   *  rotation if isActive is true AND headline is non-empty — resolved in
   *  app/(public)/page.tsx, not inside the Hero/HeroSlideshow components
   *  themselves. Zero usable slides falls back to the hardcoded
   *  DEFAULT_HERO (components/public/hero.tsx). */
  heroSlide1: HeroSlideSettings;
  heroSlide2: HeroSlideSettings;
  heroSlide3: HeroSlideSettings;
  /** Homepage About / Tentang Perkasa section — see
   *  supabase/migrations/20260818010000_homepage_about_section.sql. A
   *  single fixed section (not a slideshow like Hero). Only renders when
   *  isActive is true AND both headline and description are non-empty —
   *  resolved in app/(public)/page.tsx. There's no hardcoded default
   *  copy to fall back to (unlike Hero's DEFAULT_HERO), so an
   *  unconfigured section is simply omitted from the homepage, not
   *  replaced with placeholder content. */
  about: AboutSectionSettings;
  /** Homepage Why Perkasa section header — see
   *  supabase/migrations/20260819010000_why_perkasa_and_testimonials_storage.sql.
   *  The benefit cards themselves live in the homepage_benefits table
   *  (lib/data/homepage-benefits.ts), not here — this is only the
   *  section's eyebrow/headline/description/active. Falls back to the
   *  hardcoded DEFAULT_WHY_PERKASA (components/public/why-perkasa-section.tsx)
   *  when inactive or headline is empty, same pattern as Hero. */
  whyPerkasa: WhyPerkasaSectionSettings;
}

export interface HeroSlideSettings {
  eyebrow: string | null;
  headline: string | null;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
}

export interface AboutSectionSettings {
  eyebrow: string | null;
  headline: string | null;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
}

export interface WhyPerkasaSectionSettings {
  eyebrow: string | null;
  headline: string | null;
  description: string | null;
  isActive: boolean;
}
