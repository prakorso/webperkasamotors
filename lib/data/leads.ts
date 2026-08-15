import "server-only";
import type { Lead } from "@/lib/types";
import { getSupabaseSessionClient } from "@/lib/supabase/server-session";

/**
 * Read-only. The write path (public lead creation) lives in
 * lib/actions/leads.ts as its own whole-file "use server" module, same
 * split as every other domain in this codebase.
 *
 * Admin-only — session-authenticated. RLS's "staff can read leads"
 * policy (supabase/migrations/*_rls_policies.sql) is what actually
 * allows this; an inactive or signed-out caller gets zero rows, not an
 * error, since RLS filters rather than rejects. There is no public read
 * path for leads at all — "anyone can submit a lead" is INSERT-only.
 */

const LEAD_COLUMNS =
  "id, customer_name, phone, email, message, interested_vehicle_id, source, status, notes, created_at";

interface LeadRow {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  message: string;
  interested_vehicle_id: string | null;
  source: Lead["source"];
  status: Lead["status"];
  notes: string | null;
  created_at: string;
}

function mapLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    message: row.message,
    interestedVehicleId: row.interested_vehicle_id,
    source: row.source,
    status: row.status,
    // Staff assignment display isn't part of this phase — assigned_staff_id
    // exists on the row but resolving it to a name would need a join this
    // phase doesn't call for. Every current lead is unassigned anyway.
    assignedStaffName: undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

/** Admin-only: every lead, newest first. */
export async function getAllLeadsForAdmin(): Promise<Lead[]> {
  const supabase = await getSupabaseSessionClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllLeadsForAdmin: ${error.message}`);
  return (data as unknown as LeadRow[]).map(mapLeadRow);
}
