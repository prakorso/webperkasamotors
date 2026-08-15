import { cn } from "@/lib/utils/cn";

interface LogoProps {
  companyName: string;
  logoUrl: string | null;
  /** Font-size/color utilities for the company name text. */
  textClassName?: string;
  /** Height utilities for the image, when a real logo asset exists. */
  imageClassName?: string;
}

/**
 * Shared by the public header, mobile header, and admin sidebar.
 *
 * When a logo asset exists: renders the logo image FOLLOWED BY the
 * company name, side by side — not one instead of the other. (Earlier
 * this was an either/or: once a logo existed, the text disappeared
 * entirely. That was wrong — company_name comes from the same
 * website_settings row and should always render; the logo supplements
 * the wordmark, it doesn't replace it.)
 *
 * When no logo exists: the company name alone is the primary brand mark,
 * exactly as before.
 *
 * Plain <img>, not next/image: an uploaded brand mark can be any aspect
 * ratio, and CSS height-driven sizing (imageClassName="h-8") is simpler
 * than fighting next/image's required width/height for an asset whose
 * dimensions aren't known ahead of time.
 */
export function Logo({ companyName, logoUrl, textClassName, imageClassName }: LogoProps) {
  const text = (
    <span className={cn("whitespace-nowrap font-display tracking-tight", textClassName)}>
      {companyName}
    </span>
  );

  if (!logoUrl) return text;

  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={companyName}
        className={cn("w-auto shrink-0 object-contain", imageClassName)}
      />
      {text}
    </span>
  );
}
