import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

export interface HeroContent {
  eyebrow: string | null;
  headline: string;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string;
}

/**
 * The original, always-safe hero — used whenever the CMS hero is
 * inactive or has no headline. app/(public)/page.tsx resolves which of
 * these two (this, or the CMS content) to pass down; Hero itself never
 * makes that decision, so it stays a plain presentational component with
 * no knowledge of website_settings, "active" flags, or fallback rules.
 */
export const DEFAULT_HERO: HeroContent = {
  eyebrow: null,
  headline: "Presisi.\nPerforma.\nPerkasa.",
  description:
    "A curated showroom of inspected, premium vehicles — every unit verified before it reaches you.",
  imageUrl: null,
  ctaLabel: "Lihat Stok Tersedia",
  ctaUrl: "/cars",
};

/**
 * Homepage hero — three distinct typographic compositions, matching the
 * proven Stitch pattern: 72px desktop / 56px tablet / 40px mobile, each
 * with its own line-height and hero height, not one size scaled down.
 *
 * headline supports embedded newlines (rendered as <br/> between lines) —
 * the default hero's three-line "Presisi. / Performa. / Perkasa." look
 * is achieved this way, and a CMS-entered headline can use the same
 * technique via a multi-line textarea in the admin form.
 */
export function Hero({ eyebrow, headline, description, imageUrl, ctaLabel, ctaUrl }: HeroContent) {
  const headlineLines = headline.split("\n").filter(Boolean);

  return (
    <section className="relative flex h-[68vh] w-full items-center overflow-hidden bg-ink md:h-[70vh] lg:h-[80vh]">
      {imageUrl ? (
        <>
          <Image src={imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          {/* Dark scrim over a real photo — keeps text-paper headline/body
              legible the same way the default gradient treatment does. */}
          <div className="absolute inset-0 bg-ink/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(215,25,32,0.18),transparent_60%)]" />
      )}
      <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-8 lg:px-margin">
        <div className="max-w-xl lg:max-w-2xl">
          {eyebrow && (
            <p className="mb-3 font-body text-label uppercase tracking-[0.1em] text-primary">{eyebrow}</p>
          )}
          <h1 className="font-display text-display-sm text-paper md:text-display-md lg:text-display-lg">
            {headlineLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headlineLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          {description && (
            <p className="mt-6 max-w-md font-body text-body text-paper/70 lg:text-body-lg">{description}</p>
          )}
          <div className="mt-8">
            <Link href={ctaUrl} className={buttonVariants({ variant: "primary", size: "lg" })}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
