"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Action, separated from lib/data/footer.ts's plain read function —
 * see lib/actions/site-settings.ts for why the split exists.
 */

export interface UpdateFooterSettingsInput {
  footerDescription: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  copyrightText: string;
}

/**
 * Updates the website_settings fields the Footer Manager screen owns.
 * These are the same underlying columns General Settings can also edit
 * (contact/social/copyright are one canonical set of fields with two
 * admin entry points, not two separate stores) — footer nav groups and
 * legal links themselves go through lib/actions/navigation.ts with
 * placement FOOTER_NAV / FOOTER_LEGAL.
 */
export async function updateFooterSettings(
  input: UpdateFooterSettingsInput
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("website_settings")
    .update({
      footer_description: input.footerDescription,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      address: input.address,
      instagram_url: input.instagramUrl,
      facebook_url: input.facebookUrl,
      tiktok_url: input.tiktokUrl,
      youtube_url: input.youtubeUrl,
      copyright_text: input.copyrightText,
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}
