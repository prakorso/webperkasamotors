"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Actions must live in their own whole-file `"use server"` module,
 * separate from lib/data/site-settings.ts's plain read functions — mixing
 * the two in one file breaks Next's client/server bundle split the moment
 * a Client Component imports anything from it (confirmed against
 * node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md).
 * lib/data/site-settings.ts still owns the shape (WebsiteSettings) and the
 * read path; this file only owns writes.
 */

export interface UpdateWebsiteSettingsInput {
  companyName: string;
  tagline: string | null;
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
  defaultCtaLabel: string | null;
  defaultCtaUrl: string | null;
  copyrightText: string;
  whatsappLeadTemplate: string | null;
  whatsappLeadNumber: string | null;
}

/** Staff-only. RLS enforces this regardless — the session client carries no elevated privilege on its own. */
export async function updateWebsiteSettings(
  input: UpdateWebsiteSettingsInput
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("website_settings")
    .update({
      company_name: input.companyName,
      tagline: input.tagline,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      address: input.address,
      instagram_url: input.instagramUrl,
      facebook_url: input.facebookUrl,
      tiktok_url: input.tiktokUrl,
      youtube_url: input.youtubeUrl,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      default_cta_label: input.defaultCtaLabel,
      default_cta_url: input.defaultCtaUrl,
      copyright_text: input.copyrightText,
      // Trimmed-empty is treated the same as null — a textarea cleared to
      // whitespace should fall back to the default template, not save an
      // effectively-blank one that would send an empty WhatsApp message.
      whatsapp_lead_template: input.whatsappLeadTemplate?.trim() || null,
      // Same trimmed-empty-is-null treatment as the template above —
      // clearing this field is a deliberate "fall back to General
      // WhatsApp" reset, not an attempt to save a blank number.
      whatsapp_lead_number: input.whatsappLeadNumber?.trim() || null,
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export interface UpdateHeroSlideInput {
  eyebrow: string | null;
  headline: string | null;
  description: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
}

export interface UpdateHeroSlidesInput {
  slide1: UpdateHeroSlideInput;
  slide2: UpdateHeroSlideInput;
  slide3: UpdateHeroSlideInput;
}

/**
 * Staff-only, same pattern as updateWebsiteSettings — separate function
 * because it's a separate admin form (Website > Homepage > Hero), scoped
 * to just the hero_N_* columns so saving Hero never has to also submit
 * every other Website Settings field. One call for all three slides —
 * the admin form has a single "Save Changes" button for the whole Hero
 * Slides section, matching the original single-hero form's UX.
 */
export async function updateHeroSlides(
  input: UpdateHeroSlidesInput
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("website_settings")
    .update({
      hero_1_eyebrow: input.slide1.eyebrow,
      hero_1_headline: input.slide1.headline,
      hero_1_description: input.slide1.description,
      hero_1_cta_label: input.slide1.ctaLabel,
      hero_1_cta_url: input.slide1.ctaUrl,
      hero_1_is_active: input.slide1.isActive,
      hero_2_eyebrow: input.slide2.eyebrow,
      hero_2_headline: input.slide2.headline,
      hero_2_description: input.slide2.description,
      hero_2_cta_label: input.slide2.ctaLabel,
      hero_2_cta_url: input.slide2.ctaUrl,
      hero_2_is_active: input.slide2.isActive,
      hero_3_eyebrow: input.slide3.eyebrow,
      hero_3_headline: input.slide3.headline,
      hero_3_description: input.slide3.description,
      hero_3_cta_label: input.slide3.ctaLabel,
      hero_3_cta_url: input.slide3.ctaUrl,
      hero_3_is_active: input.slide3.isActive,
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export type SiteAssetField = "logo" | "favicon" | "ogImage" | "hero1Image" | "hero2Image" | "hero3Image";

const ASSET_COLUMN: Record<SiteAssetField, string> = {
  logo: "logo_storage_path",
  favicon: "favicon_storage_path",
  ogImage: "seo_og_image_storage_path",
  hero1Image: "hero_1_image_storage_path",
  hero2Image: "hero_2_image_storage_path",
  hero3Image: "hero_3_image_storage_path",
};

/**
 * Metadata-only — the actual upload to the site-assets bucket now happens
 * directly from the browser (components/admin/asset-upload-field.tsx, via
 * lib/storage/upload-image.ts), never here. This function's only job is
 * to point the corresponding website_settings column at an object that
 * already exists in Storage. It receives a storage path string, never a
 * File or FormData — no image bytes pass through this Server Action.
 *
 * REVISED (Phase 5 Media Architecture): this used to be uploadSiteAsset,
 * accepting FormData with the raw File and calling storage.upload() from
 * inside this Server Action — routing multi-megabyte image bytes through
 * a Netlify serverless function, the same failure mode already root-caused
 * and fixed for Vehicle Photos (lib/actions/vehicle-media.ts). Logo and
 * Favicon occasionally survived that (small files); Hero and OG Image,
 * being larger marketing imagery, consistently didn't — hence the
 * reported 504 on Hero specifically, even though the underlying bug was
 * identical across all four fields.
 *
 * storagePath is validated against the field's own naming convention
 * (`${field}-...`, exactly what asset-upload-field.tsx generates) before
 * being trusted — not an RLS boundary (the bucket policy doesn't scope by
 * filename), just a sanity check against a buggy or malicious caller
 * pointing this column at an unrelated object, mirroring
 * recordVehicleMediaUpload's own prefix check.
 */
export async function recordSiteAsset(
  field: SiteAssetField,
  storagePath: string
): Promise<{ error: string | null }> {
  if (!storagePath || !storagePath.startsWith(`${field}-`)) {
    return { error: "Invalid storage path." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("website_settings")
    .update({ [ASSET_COLUMN[field]]: storagePath, updated_by: user.id })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
