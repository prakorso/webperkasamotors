import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { WhatsappIcon } from "@/components/icons/social-icons";

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
}

/**
 * The single public WhatsApp call-to-action. A plain anchor with
 * target="_blank" + rel="noopener noreferrer", so the browser/OS routes
 * to the installed WhatsApp app on mobile and web.whatsapp.com on
 * desktop — no JS, no window.open. Styled with the shared buttonVariants
 * so it matches every other CTA on the site (focus ring, tap target,
 * icon alignment all come from there).
 */
export function WhatsAppCta({
  href,
  label,
  variant = "primary",
  size = "lg",
  className,
  ariaLabel,
}: WhatsAppCtaProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ?? label}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      <WhatsappIcon size={16} aria-hidden="true" />
      {label}
    </a>
  );
}
