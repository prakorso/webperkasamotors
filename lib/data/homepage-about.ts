import "server-only";
import type { HomepageAbout, HomepageAboutAdminState } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Homepage "Tentang Perkasa Motors" content. Read separately from
 * getWebsiteSettings on purpose: the homepage_about_* columns come from a
 * migration that is applied only after Owner authorization, and selecting a
 * column that does not exist yet would fail the whole settings read. This
 * reader selects only those columns and fails open: if they are missing
 * (or the read fails) it returns "nothing stored" so the homepage renders
 * its code-owned default copy, and the admin editor reports the schema as
 * not ready instead of pretending to save.
 */
const COLUMNS =
  "homepage_about_eyebrow, homepage_about_title, homepage_about_description, " +
  "homepage_about_point_1, homepage_about_point_2, homepage_about_point_3, homepage_about_is_active";

interface Row {
  homepage_about_eyebrow: string | null;
  homepage_about_title: string | null;
  homepage_about_description: string | null;
  homepage_about_point_1: string | null;
  homepage_about_point_2: string | null;
  homepage_about_point_3: string | null;
  homepage_about_is_active: boolean | null;
}

const NOTHING_STORED: HomepageAbout = {
  eyebrow: null,
  title: null,
  description: null,
  points: [null, null, null],
  isActive: true,
};

export async function getHomepageAboutState(): Promise<HomepageAboutAdminState> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("website_settings").select(COLUMNS).eq("id", 1).maybeSingle();
    if (error || !data) return { about: NOTHING_STORED, schemaReady: false };
    const row = data as unknown as Row;
    return {
      schemaReady: true,
      about: {
        eyebrow: row.homepage_about_eyebrow,
        title: row.homepage_about_title,
        description: row.homepage_about_description,
        points: [row.homepage_about_point_1, row.homepage_about_point_2, row.homepage_about_point_3],
        isActive: row.homepage_about_is_active ?? true,
      },
    };
  } catch {
    return { about: NOTHING_STORED, schemaReady: false };
  }
}

export async function getHomepageAbout(): Promise<HomepageAbout> {
  return (await getHomepageAboutState()).about;
}
