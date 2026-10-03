import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { WhatsappIcon } from "@/components/icons/social-icons";
import type { CtaLocation, CtaContext, ListContext } from "@/lib/measurement/events";
import type { VehicleStatus } from "@/lib/types";

/** Measurement context for the single delegated whatsapp_click listener (components/public/measurement-loader.tsx) — never destination number or message text, see lib/measurement/events.ts. */
interface WhatsAppTracking {
  location: CtaLocation;
  context: CtaContext;
  listContext?: ListContext;
  itemId?: string;
  itemName?: string;
  itemBrand?: string;
  itemCategory?: string;
  itemVariant?: string;
  vehicleStatus?: VehicleStatus;
  value?: number;
}

interface WhatsAppCtaProps {
  /** Pre-built wa.me URL — see lib/utils/whatsapp.ts:buildWhatsAppUrl. Render nothing when that returns null. */
  href: string;
  /** Visible button text. Always phrased so it's clear the button opens WhatsApp. */
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Accessible name; defaults to `label`. Pass when the visible text needs more context (e.g. which vehicle). */
  ariaLabel?: string;
  tracking: WhatsAppTracking;
}

/**
 * The single public WhatsApp call-to-action. A plain anchor with
 * target="_blank" + rel="noopener noreferrer", so the browser/OS routes
 * to the installed WhatsApp app on mobile and web.whatsapp.com on
 * desktop — no JS, no window.open. Styled with the shared buttonVariants
 * so it matches every other CTA on the site (focus ring, tap target,
 * icon alignment all come from there).
 *
 * `tracking` renders as data-wa-* attributes read by the one delegated
 * click listener in components/public/measurement-loader.tsx — this
 * component itself has no click handler and no analytics import.
 */
export function WhatsAppCta({
  href,
  label,
  variant = "primary",
  size = "lg",
  className,
  ariaLabel,
  tracking,
}: WhatsAppCtaProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? label}
      className={cn(buttonVariants({ variant, size }), className)}
      data-wa-location={tracking.location}
      data-wa-context={tracking.context}
      data-wa-list-context={tracking.listContext}
      data-item-id={tracking.itemId}
      data-item-name={tracking.itemName}
      data-item-brand={tracking.itemBrand}
      data-item-category={tracking.itemCategory}
      data-item-variant={tracking.itemVariant}
      data-vehicle-status={tracking.vehicleStatus}
      data-value={tracking.value}
    >
      <WhatsappIcon size={16} aria-hidden="true" />
      {label}
    </a>
  );
}
