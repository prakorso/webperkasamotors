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
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export type SiteAssetField = "logo" | "favicon" | "ogImage";

const ASSET_COLUMN: Record<SiteAssetField, string> = {
  logo: "logo_storage_path",
  favicon: "favicon_storage_path",
  ogImage: "seo_og_image_storage_path",
};

/**
 * Uploads a brand asset (logo/favicon/OG image) to the site-assets bucket
 * and points the corresponding website_settings column at it. Staff-only —
 * enforced by the bucket's storage policy (see
 * supabase/migrations/*_site_assets_bucket.sql), not by anything in this
 * function.
 */
export async function uploadSiteAsset(
  field: SiteAssetField,
  formData: FormData
): Promise<{ error: string | null }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${field}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("website_settings")
    .update({ [ASSET_COLUMN[field]]: path, updated_by: user.id })
    .eq("id", 1);
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return { error: null };
}
