import "server-only";
import type { WebsiteSettings } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Read-only. Mutations (updateWebsiteSettings, uploadSiteAsset) live in
 * lib/actions/site-settings.ts — Server Actions need their own
 * whole-file "use server" module, separate from this "server-only" read
 * module, or importing either from a Client Component breaks Next's
 * client/server bundle split. See that file's header comment.
 */

const SITE_ASSETS_BUCKET = "site-assets";

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
};

const SETTINGS_COLUMNS =
  "company_name, tagline, logo_storage_path, favicon_storage_path, phone, whatsapp, " +
  "email, address, instagram_url, facebook_url, tiktok_url, youtube_url, seo_title, " +
  "seo_description, seo_og_image_storage_path, default_cta_label, default_cta_url, " +
  "copyright_text, footer_description";

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
}

function resolvePublicUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  const supabase = getSupabaseServerClient();
  const { data } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
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
