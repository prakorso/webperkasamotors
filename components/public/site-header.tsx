import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WhatsappIcon } from "@/components/icons/social-icons";
import { MobileNav, MobileSearchButton } from "./mobile-nav";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { getNavigationItems } from "@/lib/data/navigation";
import { genericWhatsAppUrl } from "@/lib/utils/whatsapp";

/**
 * Three intentional compositions, not one scaled down:
 *  - Desktop (xl: 1280px+)  full nav + CTA, spacious padding
 *  - Tablet  (md: 768–1279) logo + search + menu, reduced padding
 *  - Mobile  (<768)         logo + search + hamburger, compact padding
 * The wordmark carries `whitespace-nowrap` at every breakpoint so it can
 * never wrap onto two lines regardless of available width.
 *
 * PHASE 2C fix: the tablet/desktop switch used to be `lg:` (1024px) —
 * verified via screenshot at 1024px (a real iPad-landscape width) that
 * the full nav wrapped ("BELI MOBIL" onto two lines) and crowded the
 * wordmark right at that boundary. Moved the switch to `xl:` (1280px), an
 * existing standard Tailwind breakpoint — same 3 compositions, just a
 * wider point before the full desktop nav commits to one line. Verified
 * clean again by re-screenshotting at 1024px after the change.
 *
 * PHASE 2C: company name/logo and nav links are database-driven (Website
 * Settings + Header/Navigation Manager, via lib/data) — this component no
 * longer hardcodes any of it. getWebsiteSettings/getNavigationItems both
 * fail safe to sensible defaults, so an empty or unreachable database
 * still renders this exact header, just with default content.
 */
export async function SiteHeader() {
  const [settings, navItems] = await Promise.all([
    getWebsiteSettings(),
    getNavigationItems("HEADER"),
  ]);

  const links = navItems.filter((item) => !item.isCta);
  const cta = navItems.find((item) => item.isCta);
  // The header CTA ("Hubungi Kami") opens WhatsApp directly with the
  // generic message — no lead form. Falls back to its configured nav href
  // (e.g. /contact) only if no usable WhatsApp number is set.
  const ctaWhatsAppHref = genericWhatsAppUrl(settings);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="relative mx-auto flex h-16 max-w-container items-center justify-between px-6 md:h-[72px] md:px-8 xl:h-20 xl:px-margin">
        <Link href="/" className="whitespace-nowrap">
          <Logo
            companyName={settings.companyName}
            logoUrl={settings.logoUrl}
            textClassName="text-headline-sm text-ink xl:text-headline-lg"
            imageClassName="h-8 xl:h-10"
          />
        </Link>

        {/* Desktop only: full navigation */}
        <nav aria-label="Primary" className="hidden gap-8 xl:flex">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              target={link.isExternal ? "_blank" : undefined}
              rel={link.isExternal ? "noopener noreferrer" : undefined}
              className="font-body text-label uppercase tracking-[0.1em] text-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop only: search + primary CTA */}
        <div className="hidden items-center gap-4 xl:flex">
          <button
            type="button"
            aria-label="Search"
            className="text-muted transition-colors hover:text-primary"
          >
            <Search size={20} aria-hidden />
          </button>
          {cta &&
            (ctaWhatsAppHref ? (
              <a
                href={ctaWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-2 bg-primary px-6 font-body text-label uppercase tracking-[0.1em] text-primary-ink transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <WhatsappIcon size={14} aria-hidden="true" />
                {cta.label}
              </a>
            ) : (
              <Link
                href={cta.href}
                target={cta.isExternal ? "_blank" : undefined}
                rel={cta.isExternal ? "noopener noreferrer" : undefined}
                className="flex h-11 items-center bg-primary px-6 font-body text-label uppercase tracking-[0.1em] text-primary-ink transition-colors hover:bg-primary-hover"
              >
                {cta.label}
              </Link>
            ))}
        </div>

        {/* Tablet + mobile: compact search + menu group */}
        <div className="flex items-center gap-1 xl:hidden">
          <MobileSearchButton />
          <MobileNav links={links} cta={cta} ctaWhatsAppHref={ctaWhatsAppHref ?? undefined} />
        </div>
      </div>
    </header>
  );
}
