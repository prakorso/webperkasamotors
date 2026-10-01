import Link from "next/link";
import { Hero, DEFAULT_HERO, type HeroContent } from "@/components/public/hero";
import { HeroSlideshow } from "@/components/public/hero-slideshow";
import { HowToBuySection } from "@/components/public/how-to-buy-section";
import { SectionHeading } from "@/components/public/section-heading";
import { VehicleCard } from "@/components/public/vehicle-card";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import {
  getHomepageAvailableVehicles,
  getHomepageSoldVehicles,
  getVehicleMedia,
} from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import {
  genericVehicleWhatsAppUrl,
  genericWhatsAppUrl,
  vehicleWhatsAppConfig,
} from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils/cn";
import type { HeroSlideSettings, Vehicle } from "@/lib/types";

/**
 * Unit Tersedia grid columns, keyed by how many units there actually are.
 * A small, growing inventory means this is very often 1–2 items right
 * now — a static `lg:grid-cols-4` would leave empty trailing column
 * tracks next to the real cards, which reads as broken rather than as a
 * small, intentional catalogue. Matching the column count to the real
 * count means the grid is always full. (Static class strings, not a
 * template literal, so Tailwind's build-time scanner can find them.)
 */
const GRID_COLS: Record<number, string> = {
  1: "mx-auto max-w-sm sm:grid-cols-1 lg:grid-cols-1",
  2: "mx-auto max-w-3xl sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * A slide participates in the public rotation only if it's marked active
 * AND has a headline — same bar the original single-hero column used
 * (`heroIsActive && heroHeadline?.trim()`), just applied per-slide now.
 * Image/eyebrow/description/CTA all stay optional; CTA falls back to
 * DEFAULT_HERO's own label/URL per slide, matching the original behavior.
 * Returns null for a slide that isn't usable, so the caller can filter.
 */
function resolveSlide(raw: HeroSlideSettings): HeroContent | null {
  if (!raw.isActive || !raw.headline?.trim()) return null;
  return {
    eyebrow: raw.eyebrow,
    headline: raw.headline,
    description: raw.description,
    imageUrl: raw.imageUrl,
    ctaLabel: raw.ctaLabel?.trim() || DEFAULT_HERO.ctaLabel,
    ctaUrl: raw.ctaUrl?.trim() || DEFAULT_HERO.ctaUrl,
  };
}

async function withPrimaryMedia(vehicles: Vehicle[]) {
  return Promise.all(
    vehicles.map(async (vehicle) => ({
      vehicle,
      primaryMedia: (await getVehicleMedia(vehicle.id)).find((m) => m.isPrimary),
    }))
  );
}

/**
 * Homepage (product spec): Hero > Unit Tersedia > Cara Pembelian > Unit
 * Terjual > final WhatsApp CTA. The CMS About block, "Why Perkasa" cards
 * and Testimonials are intentionally no longer rendered here (their CMS
 * data and admin editors are untouched). Available/sold units come from
 * real status queries, not from the is_featured flag.
 */
export default async function HomePage() {
  const [available, sold, settings] = await Promise.all([
    getHomepageAvailableVehicles(4),
    getHomepageSoldVehicles(),
    getWebsiteSettings(),
  ]);
  const [availableWithMedia, soldWithMedia] = await Promise.all([
    withPrimaryMedia(available),
    withPrimaryMedia(sold),
  ]);

  // Zero usable slides (nothing configured, everything inactive, or every
  // active slide missing a headline) falls back to the hardcoded hero —
  // resolved here, once, so Hero/HeroSlideshow stay plain "render what I'm
  // given" components. A CMS misconfiguration can never produce a broken
  // or empty homepage hero.
  const slides = [settings.heroSlide1, settings.heroSlide2, settings.heroSlide3]
    .map(resolveSlide)
    .filter((slide): slide is HeroContent => slide !== null);
  const whatsappConfig = vehicleWhatsAppConfig(settings);
  const genericWhatsappHref = genericWhatsAppUrl(settings);
  const emptyStateWhatsappHref = genericVehicleWhatsAppUrl(whatsappConfig);

  return (
    <>
      {slides.length > 0 ? (
        <HeroSlideshow slides={slides} whatsappHref={genericWhatsappHref} />
      ) : (
        <Hero {...DEFAULT_HERO} whatsappHref={genericWhatsappHref} />
      )}

      <section
        aria-labelledby="home-available-heading"
        className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section"
      >
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <SectionHeading title="Unit Tersedia" id="home-available-heading" className="mb-0" />
          <div className="flex gap-6 font-body text-label font-semibold uppercase tracking-[0.06em]">
            <Link href="/cars" className="text-primary transition-colors hover:text-ink">
              Semua Mobil →
            </Link>
            <Link href="/motorcycles" className="text-primary transition-colors hover:text-ink">
              Semua Motor →
            </Link>
          </div>
        </div>
        {availableWithMedia.length > 0 ? (
          <div className={cn("mt-10 grid grid-cols-1 gap-6", GRID_COLS[availableWithMedia.length] ?? GRID_COLS[4])}>
            {availableWithMedia.map(({ vehicle, primaryMedia }) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                primaryMedia={primaryMedia}
                whatsapp={whatsappConfig}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-[24px] border border-border/80 bg-surface p-6 text-center md:p-10">
            <p className="font-body text-body text-muted">Belum ada unit tersedia saat ini.</p>
            {emptyStateWhatsappHref && (
              <WhatsAppCta
                href={emptyStateWhatsappHref}
                label="Tanya via WhatsApp"
                variant="secondary"
                size="md"
                ariaLabel="Tanyakan unit yang akan datang lewat WhatsApp"
              />
            )}
          </div>
        )}
      </section>

      <HowToBuySection className="mx-auto max-w-container px-6 pb-16 md:px-8 lg:px-margin lg:pb-section" />

      {soldWithMedia.length > 0 && (
        <section
          aria-labelledby="home-sold-heading"
          className="border-t border-border/80 bg-surface-muted/40"
        >
          <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
            <SectionHeading title="Unit Terjual" id="home-sold-heading" />
            <div
              className={cn("grid grid-cols-1 gap-6", GRID_COLS[soldWithMedia.length] ?? GRID_COLS[3])}
            >
              {soldWithMedia.map(({ vehicle, primaryMedia }) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  primaryMedia={primaryMedia}
                  whatsapp={whatsappConfig}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-container px-6 py-16 text-center md:px-8 lg:px-margin lg:py-section">
        <h2 className="mx-auto max-w-2xl font-display text-headline-lg text-ink">
          Tanyakan unit yang Anda cari.
        </h2>
        <div className="mt-8">
          {genericWhatsappHref ? (
            <WhatsAppCta
              href={genericWhatsappHref}
              label="Hubungi via WhatsApp"
              className="h-auto min-h-13 whitespace-normal py-3 text-center"
            />
          ) : (
            <Link
              href="/contact"
              className="inline-flex h-13 items-center rounded-[12px] border border-primary bg-primary px-8 font-body text-label font-semibold uppercase tracking-[0.06em] text-primary-ink shadow-[0_8px_20px_rgba(215,25,32,0.14)] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary-hover hover:bg-primary-hover"
            >
              Hubungi Kami
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
