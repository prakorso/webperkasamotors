import "server-only";
import type { SocialContent } from "@/lib/types";
import { MOCK_SOCIAL_CONTENT } from "@/lib/mock/social-content";

/** PHASE 1: mock. PHASE 2: becomes a Supabase query on social_content. */
export async function getSocialContentForVehicle(
  vehicleId: string
): Promise<SocialContent[]> {
  return MOCK_SOCIAL_CONTENT.filter(
    (item) => item.vehicleId === vehicleId && item.status === "PUBLISHED"
  );
}
