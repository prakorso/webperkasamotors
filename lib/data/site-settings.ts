import "server-only";
import type { WebsiteSettings, HeroSlideSettings, AboutSectionSettings } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStoragePublicUrl } from "@/lib/storage/provider";

/**
 * Read-only. Mutations (updateWebsiteSettings, recordSiteAsset) live in
 * lib/actions/site-settings.ts — Server Actions need their own
 * whole-file "use server" module, separate from this "server-only" read
 * module, or importing either from a Client Component breaks Next's
 * client/server bundle split. See that file's header comment.
 */

const SITE_ASSETS_BUCKET = "site-assets";

/** An unconfigured slide — isActive false means it's never usable regardless of the other fields. */
const EMPTY_HERO_SLIDE: HeroSlideSettings = {
  eyebrow: null,
  headline: null,
  description: null,
  imageUrl: null,
  ctaLabel: null,
  ctaUrl: null,
  isActive: false,
};

/** An unconfigured About section — never renders regardless of isActive, since headline/description are also required. */
const EMPTY_ABOUT_SECTION: AboutSectionSettings = {
  eyebrow: null,
  headline: null,
  description: null,
  imageUrl: null,
  ctaLabel: null,
  ctaUrl: null,
  isActive: false,
};

/**
 * Matches what's hardcoded in the frontend today (app/layout.tsx,
 * site-header.tsx, site-footer.tsx) byte-for-byte. Used whenever the
 * settings row is missing or the query fails — the site must never break
 * because configuration is absent.
 */
const SAFE_DEFAULTS: WebsiteSettings = {
  companyName: "Perkasa Motors",
  tagline: null,
  logoUrl: null,
  faviconUrl: null,
  phone: null,
  whatsapp: null,
  email: null,
  address: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  seoTitle: "Perkasa Motors — Premium Automotive Showroom",
  seoDescription:
    "Perkasa Motors is a curated premium automotive showroom — precision, performance, and Perkasa.",
  seoOgImageUrl: null,
  defaultCtaLabel: null,
  defaultCtaUrl: null,
  copyrightText: "All rights reserved.",
  footerDescription: "Premium automotive digital showroom. Presisi, Performa, Perkasa.",
  whatsappLeadTemplate: null,
  whatsappLeadNumber: null,
  heroSlide1: EMPTY_HERO_SLIDE,
  heroSlide2: EMPTY_HERO_SLIDE,
  heroSlide3: EMPTY_HERO_SLIDE,
  about: EMPTY_ABOUT_SECTION,
};

const SETTINGS_COLUMNS =
  "company_name, tagline, logo_storage_path, favicon_storage_path, phone, whatsapp, " +
  "email, address, instagram_url, facebook_url, tiktok_url, youtube_url, seo_title, " +
  "seo_description, seo_og_image_storage_path, default_cta_label, default_cta_url, " +
  "copyright_text, footer_description, whatsapp_lead_template, whatsapp_lead_number, " +
  "hero_1_eyebrow, hero_1_headline, hero_1_description, hero_1_image_storage_path, " +
  "hero_1_cta_label, hero_1_cta_url, hero_1_is_active, " +
  "hero_2_eyebrow, hero_2_headline, hero_2_description, hero_2_image_storage_path, " +
  "hero_2_cta_label, hero_2_cta_url, hero_2_is_active, " +
  "hero_3_eyebrow, hero_3_headline, hero_3_description, hero_3_image_storage_path, " +
  "hero_3_cta_label, hero_3_cta_url, hero_3_is_active, " +
  "about_eyebrow, about_headline, about_description, about_image_storage_path, " +
  "about_cta_label, about_cta_url, about_is_active";

interface SettingsRow {
  company_name: string;
  tagline: string | null;
  logo_storage_path: string | null;
  favicon_storage_path: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image_storage_path: string | null;
  default_cta_label: string | null;
  default_cta_url: string | null;
  copyright_text: string;
  footer_description: string | null;
  whatsapp_lead_template: string | null;
  whatsapp_lead_number: string | null;
  hero_1_eyebrow: string | null;
  hero_1_headline: string | null;
  hero_1_description: string | null;
  hero_1_image_storage_path: string | null;
  hero_1_cta_label: string | null;
  hero_1_cta_url: string | null;
  hero_1_is_active: boolean;
  hero_2_eyebrow: string | null;
  hero_2_headline: string | null;
  hero_2_description: string | null;
  hero_2_image_storage_path: string | null;
  hero_2_cta_label: string | null;
  hero_2_cta_url: string | null;
  hero_2_is_active: boolean;
  hero_3_eyebrow: string | null;
  hero_3_headline: string | null;
  hero_3_description: string | null;
  hero_3_image_storage_path: string | null;
  hero_3_cta_label: string | null;
  hero_3_cta_url: string | null;
  hero_3_is_active: boolean;
  about_eyebrow: string | null;
  about_headline: string | null;
  about_description: string | null;
  about_image_storage_path: string | null;
  about_cta_label: string | null;
  about_cta_url: string | null;
  about_is_active: boolean;
}

function resolvePublicUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  const supabase = getSupabaseServerClient();
  return getStoragePublicUrl(supabase, SITE_ASSETS_BUCKET, storagePath);
}

/** Raw column values for one hero_N_* group — mapHeroSlideN below picks these out of SettingsRow explicitly rather than a clever generic, to keep this readable. */
function toHeroSlide(
  eyebrow: string | null,
  headline: string | null,
  description: string | null,
  imageStoragePath: string | null,
  ctaLabel: string | null,
  ctaUrl: string | null,
  isActive: boolean
): HeroSlideSettings {
  return {
    eyebrow,
    headline,
    description,
    imageUrl: resolvePublicUrl(imageStoragePath),
    ctaLabel,
    ctaUrl,
    isActive,
  };
}

function toAboutSection(row: SettingsRow): AboutSectionSettings {
  return {
    eyebrow: row.about_eyebrow,
    headline: row.about_headline,
    description: row.about_description,
    imageUrl: resolvePublicUrl(row.about_image_storage_path),
    ctaLabel: row.about_cta_label,
    ctaUrl: row.about_cta_url,
    isActive: row.about_is_active,
  };
}

function mapSettingsRow(row: SettingsRow): WebsiteSettings {
  return {
    companyName: row.company_name,
    tagline: row.tagline,
    logoUrl: resolvePublicUrl(row.logo_storage_path),
    faviconUrl: resolvePublicUrl(row.favicon_storage_path),
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    youtubeUrl: row.youtube_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoOgImageUrl: resolvePublicUrl(row.seo_og_image_storage_path),
    defaultCtaLabel: row.default_cta_label,
    defaultCtaUrl: row.default_cta_url,
    copyrightText: row.copyright_text,
    footerDescription: row.footer_description,
    whatsappLeadTemplate: row.whatsapp_lead_template,
    whatsappLeadNumber: row.whatsapp_lead_number,
    heroSlide1: toHeroSlide(
      row.hero_1_eyebrow,
      row.hero_1_headline,
      row.hero_1_description,
      row.hero_1_image_storage_path,
      row.hero_1_cta_label,
      row.hero_1_cta_url,
      row.hero_1_is_active
    ),
    heroSlide2: toHeroSlide(
      row.hero_2_eyebrow,
      row.hero_2_headline,
      row.hero_2_description,
      row.hero_2_image_storage_path,
      row.hero_2_cta_label,
      row.hero_2_cta_url,
      row.hero_2_is_active
    ),
    heroSlide3: toHeroSlide(
      row.hero_3_eyebrow,
      row.hero_3_headline,
      row.hero_3_description,
      row.hero_3_image_storage_path,
      row.hero_3_cta_label,
      row.hero_3_cta_url,
      row.hero_3_is_active
    ),
    about: toAboutSection(row),
  };
}

/**
 * Public read — used by the public site (header, footer, root metadata)
 * AND as the read half of the admin General settings screen. Anon-keyed;
 * RLS already makes this row fully public (see
 * supabase/migrations/*_website_settings_rls.sql), so no session is
 * needed to read it.
 */
export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("website_settings")
      .select(SETTINGS_COLUMNS)
      .eq("id", 1)
      .maybeSingle();

    // TEMP DIAGNOSTIC (Batch 2 integration investigation) — this branch
    // silently returned SAFE_DEFAULTS with zero visibility into why.
    // Logging server-side only (never sent to the browser); remove once
    // the root cause is confirmed fixed.
    if (error) {
      console.error("[getWebsiteSettings] Supabase error:", error);
      return SAFE_DEFAULTS;
    }
    if (!data) {
      console.error("[getWebsiteSettings] No row returned for id=1");
      return SAFE_DEFAULTS;
    }
    return mapSettingsRow(data as unknown as SettingsRow);
  } catch (err) {
    console.error("[getWebsiteSettings] Threw:", err);
    return SAFE_DEFAULTS;
  }
}
