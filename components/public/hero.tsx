import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

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
 *
 * priority defaults to true — every existing single-Hero call site (the
 * DEFAULT_HERO fallback, or a single active CMS slide) keeps the same
 * eager-loading behavior it always had. HeroSlideshow is the only caller
 * that ever passes false, for every slide after the first — see its own
 * comment for why.
 *
 * textClassName is an optional override merged onto the text block (the
 * eyebrow/headline/description/CTA column), separate from the image
 * behind it. HeroSlideshow uses this to give outgoing/incoming text its
 * own fast-out/delayed-in timing instead of crossfading in lockstep with
 * the (slower) background image — see that file's comment for why. Plain
 * single-Hero callers never pass it, so their text has no transition of
 * its own (unchanged behavior).
 */
export function Hero({
  eyebrow,
  headline,
  description,
  imageUrl,
  ctaLabel,
  ctaUrl,
  priority = true,
  textClassName,
}: HeroContent & { priority?: boolean; textClassName?: string }) {
  const headlineLines = headline.split("\n").filter(Boolean);

  return (
    <section className="relative flex h-[72svh] min-h-[540px] w-full items-center overflow-hidden bg-ink md:h-[74svh] lg:h-[82svh] lg:min-h-[680px]">
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover object-center brightness-[0.82] saturate-[1.04]"
          />
          {/* Dark scrim over a real photo — keeps text-paper headline/body
              legible the same way the default gradient treatment does. */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,21,0.82)_0%,rgba(17,19,21,0.56)_42%,rgba(17,19,21,0.18)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/60 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(215,25,32,0.2),transparent_34%),linear-gradient(135deg,#111315_0%,#232729_52%,#111315_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,21,0.18),rgba(17,19,21,0.6))]" />
        </>
      )}
      <div className="relative z-10 mx-auto w-full max-w-container px-6 md:px-8 lg:px-margin">
        <div className={cn("max-w-xl lg:max-w-2xl", textClassName)}>
          {eyebrow && (
            <p className="mb-4 font-body text-label uppercase tracking-[0.06em] text-paper/75">{eyebrow}</p>
          )}
          <h1 className="font-display text-display-sm text-paper drop-shadow-[0_16px_34px_rgba(0,0,0,0.22)] md:text-display-md lg:text-display-lg">
            {headlineLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headlineLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          {description && (
            <p className="mt-6 max-w-lg font-body text-body text-paper/78 lg:text-body-lg">{description}</p>
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
