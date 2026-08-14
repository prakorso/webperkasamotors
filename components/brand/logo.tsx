import { cn } from "@/lib/utils/cn";

interface LogoProps {
  companyName: string;
  logoUrl: string | null;
  /** Font-size/color utilities for the text fallback (used when logoUrl is null). */
  textClassName?: string;
  /** Height utilities for the image, when a real logo asset exists. */
  imageClassName?: string;
}

/**
 * Shared by the public header, mobile header, and admin sidebar. No logo
 * asset exists yet (see the Phase 2C "brand identity" conversation) — this
 * renders the exact current text wordmark whenever `logoUrl` is null,
 * which is what every consumer sees today. The moment a real asset is
 * uploaded through Website Settings, `logoUrl` stops being null and every
 * consumer of this component picks it up with no further code change.
 *
 * Plain <img>, not next/image: an uploaded brand mark can be any aspect
 * ratio, and CSS height-driven sizing (imageClassName="h-8") is simpler
 * than fighting next/image's required width/height for an asset whose
 * dimensions aren't known ahead of time.
 */
export function Logo({ companyName, logoUrl, textClassName, imageClassName }: LogoProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={companyName}
        className={cn("w-auto object-contain", imageClassName)}
      />
    );
  }

  return (
    <span className={cn("whitespace-nowrap font-display tracking-tight", textClassName)}>
      {companyName}
    </span>
  );
}
