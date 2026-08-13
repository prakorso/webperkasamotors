import Link from "next/link";
import { Search } from "lucide-react";
import { PUBLIC_NAV_LINKS } from "./nav-links";
import { MobileNav, MobileSearchButton } from "./mobile-nav";

/**
 * Three intentional compositions, not one scaled down:
 *  - Desktop (lg: 1024px+)  full nav + CTA, spacious padding
 *  - Tablet  (md: 768–1023) logo + search + menu, reduced padding
 *  - Mobile  (<768)         logo + search + hamburger, compact padding
 * The wordmark carries `whitespace-nowrap` at every breakpoint so it can
 * never wrap onto two lines regardless of available width.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="relative mx-auto flex h-16 max-w-container items-center justify-between px-6 md:h-[72px] md:px-8 lg:h-20 lg:px-margin">
        <Link
          href="/"
          className="whitespace-nowrap font-display text-headline-sm text-ink tracking-tight lg:text-headline-lg"
        >
          Perkasa Motors
        </Link>

        {/* Desktop only: full navigation */}
        <nav aria-label="Primary" className="hidden gap-8 lg:flex">
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-label uppercase tracking-[0.1em] text-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop only: search + primary CTA */}
        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            aria-label="Search"
            className="text-muted transition-colors hover:text-primary"
          >
            <Search size={20} aria-hidden />
          </button>
          <Link
            href="/contact"
            className="flex h-11 items-center bg-primary px-6 font-body text-label uppercase tracking-[0.1em] text-primary-ink transition-colors hover:bg-primary-hover"
          >
            Hubungi Kami
          </Link>
        </div>

        {/* Tablet + mobile: compact search + menu group */}
        <div className="flex items-center gap-1 lg:hidden">
          <MobileSearchButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
