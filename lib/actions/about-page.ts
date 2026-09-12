"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Server Action for the About page ("Tentang Kami") CMS — separated from
 * lib/data/about-page.ts's plain reads, same reason as every other
 * lib/actions/*.ts file (see lib/actions/site-settings.ts).
 *
 * A single upsert-by-section_key function (rather than separate
 * create/update actions) is what keeps this genuinely extensible: adding
 * a future About section (Team, History, Standards, Closing CTA, ...) is
 * a new fieldset in components/admin/about-page-form.tsx pointed at a new
 * key — never a new Server Action, and never a schema migration.
 */

export interface UpsertAboutSectionInput {
  sectionKey: string;
  eyebrow: string | null;
  headline: string | null;
  body: string | null;
  sortOrder: number;
  isActive: boolean;
}

const HEADLINE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 4000;

/**
 * Same required-when-active rule as every other CMS section in this
 * codebase (validateAboutSection/validateWhyPerkasaSection in
 * lib/actions/site-settings.ts) — an active section with missing
 * headline/body would otherwise render as a visibly broken/empty block
 * on the public page instead of the "just don't show it" behavior an
 * inactive section gets.
 */
function validateAboutSectionInput(input: UpsertAboutSectionInput): string | null {
  if (!input.sectionKey.trim()) return "Section key is required.";
  if (input.isActive) {
    if (!input.headline?.trim()) return "Headline is required while this section is Published.";
    if (!input.body?.trim()) return "Body is required while this section is Published.";
  }
  if ((input.headline?.length ?? 0) > HEADLINE_MAX_LENGTH) {
    return `Headline must be ${HEADLINE_MAX_LENGTH} characters or fewer.`;
  }
  if ((input.body?.length ?? 0) > BODY_MAX_LENGTH) {
    return `Body must be ${BODY_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

/**
 * Staff-only. Creates the row on first save (a future section that has
 * never been saved before) or updates it in place (hero/story today) —
 * upsert keyed on the section's unique section_key, so the admin form
 * never needs to know or pass an id.
 */
export async function upsertAboutSection(
  input: UpsertAboutSectionInput
): Promise<{ error: string | null }> {
  const validationError = validateAboutSectionInput(input);
  if (validationError) return { error: validationError };

  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("about_page_sections").upsert(
    {
      section_key: input.sectionKey.trim(),
      eyebrow: input.eyebrow,
      headline: input.headline,
      body: input.body,
      sort_order: input.sortOrder,
      is_active: input.isActive,
      updated_by: user.id,
    },
    { onConflict: "section_key" }
  );

  if (error) return { error: error.message };
  revalidatePath("/about");
  return { error: null };
}
