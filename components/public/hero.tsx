import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { WhatsappIcon } from "@/components/icons/social-icons";

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
    "Mobil dan motor yang tersedia di Perkasa Motors, lengkap dengan foto, spesifikasi, dan harga. Tanya langsung lewat WhatsApp.",
  imageUrl: null,
  ctaLabel: "Lihat Unit Tersedia",
  ctaUrl: "/cars",
};

/**
 * Layout (hero responsive fix R1): from xl (1280px) up it is the original
 * full-bleed overlay hero (photo behind, text and CTAs over it). Below xl
 * (tablet and mobile) the photo gets its own block (3:2 on mobile, 16:10
 * on tablet, object-cover centered, no scrim) and the headline,
 * description and CTAs sit below it on a solid dark block, so nothing
 * covers the vehicle. Height below xl comes from the content, not a fixed
 * vh, so it never forces an aggressive crop.
 *
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
  whatsappHref,
}: HeroContent & {
  priority?: boolean;
  textClassName?: string;
  /** Optional secondary "Tanya via WhatsApp" action (generic message). Omitted when no usable WhatsApp number is configured. */
  whatsappHref?: string | null;
}) {
  const headlineLines = headline.split("\n").filter(Boolean);

  return (
    <section className="relative flex w-full flex-col overflow-hidden bg-ink xl:h-[82svh] xl:min-h-[680px] xl:flex-row xl:items-center">
      {imageUrl ? (
        <div className="relative aspect-[3/2] w-full shrink-0 md:aspect-[16/10] lg:aspect-[2/1] xl:absolute xl:inset-0 xl:aspect-auto">
          <Image
            src={imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover object-center xl:brightness-[0.82] xl:saturate-[1.04]"
          />
          {/* Desktop only: dark scrim so the overlaid headline/body stay
              legible. Below xl the text sits under the photo on a solid
              dark block instead, so the image is shown unobstructed. */}
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(17,19,21,0.82)_0%,rgba(17,19,21,0.56)_42%,rgba(17,19,21,0.18)_100%)] xl:block" />
          <div className="absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-ink/60 to-transparent xl:block" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(215,25,32,0.2),transparent_34%),linear-gradient(135deg,#111315_0%,#232729_52%,#111315_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,21,0.18),rgba(17,19,21,0.6))]" />
        </>
      )}
      <div className="relative z-10 mx-auto w-full max-w-container px-6 py-8 md:px-8 md:py-10 xl:px-margin xl:py-0">
        <div className={cn("max-w-xl xl:max-w-2xl", textClassName)}>
          {eyebrow && (
            <p className="mb-3 font-body text-label uppercase tracking-[0.06em] text-paper/75 xl:mb-4">{eyebrow}</p>
          )}
          <h1 className="font-display text-display-sm text-paper md:text-display-md xl:text-display-lg xl:drop-shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
            {headlineLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headlineLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          {description && (
            <p className="mt-4 max-w-lg font-body text-body text-paper/78 xl:mt-6 xl:text-body-lg">{description}</p>
          )}
          <div className="mt-6 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3 xl:mt-8">
            <Link href={ctaUrl} // Plain concatenation (not cn/twMerge): twMerge would drop the button's
              // custom text-label size and change the desktop button.
              className={`${buttonVariants({ variant: "primary", size: "lg" })} w-full md:w-auto`}>
              {ctaLabel}
            </Link>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  // Secondary action: a light text action on mobile, the
                  // outlined button from tablet up (lower weight than the
                  // primary CTA at every size).
                  "min-h-11 gap-2 text-paper hover:bg-paper/10 md:border md:border-paper/60"
                )}
              >
                <WhatsappIcon size={16} aria-hidden="true" />
                Tanya via WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
