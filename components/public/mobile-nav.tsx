"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { NavigationItem } from "@/lib/types";
import { WhatsappIcon } from "@/components/icons/social-icons";

interface MobileNavProps {
  links: NavigationItem[];
  cta?: NavigationItem;
  /** When set, the CTA opens WhatsApp directly (generic message) instead of navigating to cta.href. */
  ctaWhatsAppHref?: string;
}

/**
 * Client component: the interactive hamburger/menu behavior shared by the
 * tablet and mobile header compositions. Desktop never renders this — it
 * shows the full nav inline.
 *
 * PHASE 2C: links/cta come from SiteHeader (which fetches them server-side
 * via lib/data/navigation.ts) as props, rather than this component
 * importing a hardcoded array — the type import above is type-only, so it
 * doesn't pull lib/data's "server-only" module into the client bundle.
 */
export function MobileNav({ links, cta, ctaWhatsAppHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the panel when it opens, and let Escape close it and
  // return focus to the toggle — the panel previously had neither.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lock background scroll while the panel is open, and restore whatever
  // was there before on close/unmount — without this, the page behind the
  // panel kept scrolling (and stayed visibly un-dimmed, see the backdrop
  // below), so it read as part of the page rather than an overlay.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-primary"
      >
        {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
      </button>

      {open && (
        <>
          {/* Backdrop: dims and visually separates the page from the open
              panel, and doubles as a large tap target to close it — the
              panel previously floated over still-visible, still-scrollable
              page content with no separation at all. */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-40 bg-ink/40 md:top-[72px] xl:hidden"
          />
          <div
            id="mobile-nav-panel"
            ref={panelRef}
            tabIndex={-1}
            className="absolute inset-x-0 top-full z-50 border-t border-border bg-surface xl:hidden"
          >
            <nav aria-label="Primary" className="flex flex-col px-6 py-4">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setOpen(false)}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                className="border-b border-border py-4 font-body text-body-lg text-ink last:border-b-0 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            {cta &&
              (ctaWhatsAppHref ? (
                <a
                  href={ctaWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="mt-4 flex h-11 items-center justify-center gap-2 bg-primary font-body text-label uppercase tracking-[0.1em] text-primary-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <WhatsappIcon size={14} aria-hidden="true" />
                  {cta.label}
                </a>
              ) : (
                <Link
                  href={cta.href}
                  onClick={() => setOpen(false)}
                  className="mt-4 flex h-11 items-center justify-center bg-primary font-body text-label uppercase tracking-[0.1em] text-primary-ink"
                >
                  {cta.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
