import "server-only";
import type { AboutPageSection } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * About page ("Tentang Kami") sections — read-only. Mutations
 * (upsertAboutSection) live in lib/actions/about-page.ts, same
 * "server-only" reads vs. whole-file "use server" writes split as every
 * other domain in this codebase.
 */

const COLUMNS = "id, section_key, eyebrow, headline, body, sort_order, is_active";

interface AboutPageSectionRow {
  id: string;
  section_key: string;
  eyebrow: string | null;
  headline: string | null;
  body: string | null;
  sort_order: number;
  is_active: boolean;
}

function mapRow(row: AboutPageSectionRow): AboutPageSection {
  return {
    id: row.id,
    sectionKey: row.section_key,
    eyebrow: row.eyebrow,
    headline: row.headline,
    body: row.body,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Public read — active sections only, in display order. RLS's "public can read active about page sections" policy is what actually enforces the is_active filter; the .eq() here just avoids fetching rows we'd discard anyway. */
export async function getPublishedAboutSections(): Promise<AboutPageSection[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("about_page_sections")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getPublishedAboutSections: ${error.message}`);
  return (data as unknown as AboutPageSectionRow[]).map(mapRow);
}

/** Admin-only: every section regardless of published state, in display order — the Website > About admin screen. */
export async function getAllAboutSectionsForAdmin(): Promise<AboutPageSection[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("about_page_sections")
    .select(COLUMNS)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getAllAboutSectionsForAdmin: ${error.message}`);
  return (data as unknown as AboutPageSectionRow[]).map(mapRow);
}
