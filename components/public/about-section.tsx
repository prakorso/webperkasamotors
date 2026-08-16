import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface AboutContent {
  eyebrow: string | null;
  headline: string;
  description: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

/**
 * Homepage About / Tentang Perkasa. Unlike Hero, there's no hardcoded
 * default copy for this section to fall back to — it simply doesn't
 * exist on the page at all unless the CMS has real content configured
 * (app/(public)/page.tsx decides that, this stays a plain "render what
 * I'm given" presentational component, same split as Hero/HeroSlideshow).
 *
 * ONE image, no separate desktop/mobile fields (see the CMS admin form):
 * a fixed aspect-ratio crop container handles portrait, landscape, or no
 * image at all — object-cover crops to fill without distorting, and the
 * two-column layout collapses to a single column on mobile via Tailwind
 * breakpoints, not a second content field. When there's no image, the
 * text block centers itself instead of leaving an empty column, so the
 * section still looks intentional with Image left empty (which is
 * expected/optional, not a fallback path).
 */
export function AboutSection({ eyebrow, headline, description, imageUrl, ctaLabel, ctaUrl }: AboutContent) {
  const hasImage = Boolean(imageUrl);
  const hasCta = Boolean(ctaLabel?.trim() && ctaUrl?.trim());

  return (
    <section className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <div
        className={cn(
          "grid grid-cols-1 items-center gap-10 lg:gap-16",
          hasImage && "lg:grid-cols-2"
        )}
      >
        {hasImage && (
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted lg:aspect-square">
            <Image
              src={imageUrl!}
              alt={headline}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className={cn(!hasImage && "mx-auto max-w-2xl text-center")}>
          {eyebrow && (
            <p className="mb-3 font-body text-label uppercase tracking-[0.1em] text-primary">{eyebrow}</p>
          )}
          <h2 className="font-display text-headline-lg text-ink">{headline}</h2>
          <p className="mt-6 font-body text-body text-muted lg:text-body-lg">{description}</p>
          {hasCta && (
            <div className="mt-8">
              <Link href={ctaUrl!} className={buttonVariants({ variant: "secondary", size: "lg" })}>
                {ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
