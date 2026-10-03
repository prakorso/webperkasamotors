"use client";

import { useEffect, useRef } from "react";
import type { Vehicle } from "@/lib/types";
import { trackViewItem } from "@/lib/measurement/events";

/**
 * Renders nothing. Fires GA4 view_item exactly once per vehicle detail
 * page view (AVAILABLE, RESERVED and SOLD all qualify). The useRef guard
 * is what makes this "once per mount" survive React 18/19 StrictMode's
 * dev-only double effect invocation — a real client-side navigation to a
 * different vehicle remounts this component (new instance), so it still
 * fires once per actual page view.
 */
export function ViewItemTracker({ vehicle }: { vehicle: Vehicle }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackViewItem({ vehicle });
    // Only the identity fields matter for re-firing decisions; vehicle is
    // otherwise treated as a snapshot for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.id]);

  return null;
}
