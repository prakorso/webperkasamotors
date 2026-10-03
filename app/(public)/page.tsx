import Link from "next/link";
import { Hero, DEFAULT_HERO, type HeroContent } from "@/components/public/hero";
import { HeroSlideshow } from "@/components/public/hero-slideshow";
import { HomepageAboutSection } from "@/components/public/homepage-about-section";
import { HowToBuySection } from "@/components/public/how-to-buy-section";
import { PaymentMethodsSection } from "@/components/public/payment-methods-section";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { SectionHeading } from "@/components/public/section-heading";
import { VehicleCard } from "@/components/public/vehicle-card";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import {
  getHomepageAvailableVehicles,
  getHomepageSoldVehicles,
  getVehicleMedia,
} from "@/lib/data/vehicles";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { getHomepageAbout } from "@/lib/data/homepage-about";
import { getActiveAboutMedia } from "@/lib/data/homepage-about-media";
import { getActiveTestimonials } from "@/lib/data/testimonials";
import {
  genericVehicleWhatsAppUrl,
  genericWhatsAppUrl,
  paymentWhatsAppUrl,
  vehicleWhatsAppConfig,
} from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils/cn";
import type { Metadata } from "next";
import type { HeroSlideSettings, Vehicle } from "@/lib/types";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

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
  5: "sm:grid-cols-2 lg:grid-cols-3",
  6: "sm:grid-cols-2 lg:grid-cols-3",
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
 * Homepage (Owner-approved IA, locked order): Hero > Unit Tersedia > Tentang
 * Perkasa Motors > Cara Pembelian > Mekanisme Pembayaran > Testimoni (only
 * when real active testimonials exist) > Unit Terjual > footer. There is no
 * separate final CTA block: WhatsApp is reachable from the hero, the header,
 * the payment section, every unit card and the footer. Unit Tersedia is
 * capped at 6 (balanced cars/motorcycles) and Unit Terjual at 4, both
 * limited in the data layer; neither uses the is_featured flag.
 */
export default async function HomePage() {
  const [available, sold, settings, about, aboutMedia, testimonials] = await Promise.all([
    getHomepageAvailableVehicles(),
    getHomepageSoldVehicles(),
    getWebsiteSettings(),
    getHomepageAbout(),
    getActiveAboutMedia(),
    getActiveTestimonials().catch(() => []),
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
  const paymentWhatsappHref = paymentWhatsAppUrl(settings);

  return (
    <>
      {slides.length > 0 ? (
        <HeroSlideshow slides={slides} whatsappHref={genericWhatsappHref} />
      ) : (
        <Hero {...DEFAULT_HERO} whatsappHref={genericWhatsappHref} />
      )}

      <section
        id="unit-tersedia"
        aria-labelledby="home-available-heading"
        className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section"
      >
        <SectionHeading title="Unit Tersedia" id="home-available-heading" className="mb-0" />
        {availableWithMedia.length > 0 ? (
          <div className={cn("mt-10 grid grid-cols-1 gap-6", GRID_COLS[availableWithMedia.length] ?? GRID_COLS[6])}>
            {availableWithMedia.map(({ vehicle, primaryMedia }) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                primaryMedia={primaryMedia}
                whatsapp={whatsappConfig}
                listContext="home_available"
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
                tracking={{ location: "catalogue_empty_state", context: "generic" }}
              />
            )}
          </div>
        )}
        <nav aria-label="Lihat semua unit" className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/cars" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Lihat Semua Mobil
          </Link>
          <Link href="/motorcycles" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Lihat Semua Motor
          </Link>
        </nav>
      </section>

      <HomepageAboutSection
        about={about}
        media={aboutMedia}
        companyName={settings.companyName}
        address={settings.address}
        className="mx-auto max-w-container border-t border-border/80 px-6 py-16 md:px-8 lg:px-margin lg:py-section"
      />

      <div className="border-y border-border/80 bg-surface-muted/40">
        <HowToBuySection className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section" />
      </div>

      <PaymentMethodsSection
        whatsappHref={paymentWhatsappHref}
        className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section"
      />

      <TestimonialsSection
        testimonials={testimonials}
        className="border-t border-border/80 bg-surface py-16 lg:py-section"
      />

      {soldWithMedia.length > 0 && (
        <section
          id="unit-terjual"
          aria-labelledby="home-sold-heading"
          className="border-t border-border/80 bg-surface-muted/40"
        >
          <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
            <SectionHeading title="Unit Terjual" id="home-sold-heading" />
            <div
              className={cn("grid grid-cols-1 gap-6", GRID_COLS[soldWithMedia.length] ?? GRID_COLS[4])}
            >
              {soldWithMedia.map(({ vehicle, primaryMedia }) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  primaryMedia={primaryMedia}
                  whatsapp={whatsappConfig}
                  listContext="home_sold"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
