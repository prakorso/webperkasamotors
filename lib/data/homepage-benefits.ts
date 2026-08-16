import "server-only";
import type { HomepageBenefit } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Why Perkasa benefit cards — read-only. Mutations (create/update/
 * delete/reorder) live in lib/actions/homepage-benefits.ts, same
 * "server-only" reads vs. whole-file "use server" writes split as every
 * other domain in this codebase.
 */

const COLUMNS = "id, title, description, icon, sort_order, is_active";

interface BenefitRow {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

function mapRow(row: BenefitRow): HomepageBenefit {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** Public read — active benefits only, in display order. RLS's "public can read active homepage benefits" policy is what actually enforces the is_active filter; the .eq() here just avoids fetching rows we'd discard anyway. */
export async function getActiveHomepageBenefits(): Promise<HomepageBenefit[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("homepage_benefits")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getActiveHomepageBenefits: ${error.message}`);
  return (data as unknown as BenefitRow[]).map(mapRow);
}

/** Admin-only: every benefit regardless of active state, in display order — the Why Perkasa admin list. */
export async function getAllHomepageBenefitsForAdmin(): Promise<HomepageBenefit[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("homepage_benefits")
    .select(COLUMNS)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getAllHomepageBenefitsForAdmin: ${error.message}`);
  return (data as unknown as BenefitRow[]).map(mapRow);
}
