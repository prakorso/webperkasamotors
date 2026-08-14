import "server-only";
import type { NavPlacement, NavigationItem } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Read-only. Mutations (create/update/delete/reorder) live in
 * lib/actions/navigation.ts — see that file's header comment for why
 * Server Actions can't share a module with plain "server-only" reads.
 */

const ITEM_COLUMNS =
  "id, placement, group_label, label, href, sort_order, is_visible, is_external, is_cta";

interface NavigationItemRow {
  id: string;
  placement: NavPlacement;
  group_label: string | null;
  label: string;
  href: string;
  sort_order: number;
  is_visible: boolean;
  is_external: boolean;
  is_cta: boolean;
}

function mapRow(row: NavigationItemRow): NavigationItem {
  return {
    id: row.id,
    placement: row.placement,
    groupLabel: row.group_label,
    label: row.label,
    href: row.href,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    isExternal: row.is_external,
    isCta: row.is_cta,
  };
}

/**
 * Public read: visible items for one placement, in order. Anon-keyed —
 * RLS already filters to is_visible = true (see
 * supabase/migrations/*_website_settings_rls.sql), so this doesn't repeat
 * that filter as a defensive measure, only because it's also the correct
 * query. Falls back to an empty array on any failure — an empty nav
 * renders as "no links," never a crash.
 */
export async function getNavigationItems(placement: NavPlacement): Promise<NavigationItem[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("navigation_items")
      .select(ITEM_COLUMNS)
      .eq("placement", placement)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    // TEMP DIAGNOSTIC (Batch 2 integration investigation) — see the same
    // note in lib/data/site-settings.ts. Remove once root cause confirmed.
    if (error) {
      console.error(`[getNavigationItems:${placement}] Supabase error:`, error);
      return [];
    }
    if (!data) {
      console.error(`[getNavigationItems:${placement}] No data returned`);
      return [];
    }
    return (data as unknown as NavigationItemRow[]).map(mapRow);
  } catch (err) {
    console.error(`[getNavigationItems:${placement}] Threw:`, err);
    return [];
  }
}

/** Admin-only: every item for a placement, regardless of visibility. */
export async function getAllNavigationItemsForAdmin(
  placement: NavPlacement
): Promise<NavigationItem[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("navigation_items")
    .select(ITEM_COLUMNS)
    .eq("placement", placement)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getAllNavigationItemsForAdmin: ${error.message}`);
  return (data as unknown as NavigationItemRow[]).map(mapRow);
}
