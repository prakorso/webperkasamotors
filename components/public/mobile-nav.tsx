"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
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
 * tablet (search + menu) and mobile (logo + search + hamburger) header
 * compositions. Desktop never renders this — it shows the full nav inline.
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
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          tabIndex={-1}
          className="absolute inset-x-0 top-full border-t border-border bg-surface xl:hidden"
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
      )}
    </>
  );
}

export function MobileSearchButton() {
  return (
    <button
      type="button"
      aria-label="Search"
      className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-primary"
    >
      <Search size={20} aria-hidden />
    </button>
  );
}
