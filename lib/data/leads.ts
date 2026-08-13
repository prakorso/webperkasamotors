import "server-only";
import type { Lead } from "@/lib/types";
import { MOCK_LEADS } from "@/lib/mock/leads";

/**
 * PHASE 1: mock, read-only. No write path exists yet — the public contact
 * form and vehicle-detail CTA are visual only; nothing here persists a
 * submission. PHASE 2: becomes Supabase queries against `leads`.
 */
export async function getAllLeadsForAdmin(): Promise<Lead[]> {
  return [...MOCK_LEADS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
