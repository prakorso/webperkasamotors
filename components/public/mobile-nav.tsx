"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { PUBLIC_NAV_LINKS } from "./nav-links";

/**
 * Client component: the interactive hamburger/menu behavior shared by the
 * tablet (search + menu) and mobile (logo + search + hamburger) header
 * compositions. Desktop never renders this — it shows the full nav inline.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
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
          className="absolute inset-x-0 top-full border-t border-border bg-surface lg:hidden"
        >
          <nav aria-label="Primary" className="flex flex-col px-6 py-4">
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 font-body text-body-lg text-ink last:border-b-0 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-4 flex h-11 items-center justify-center bg-primary font-body text-label uppercase tracking-[0.1em] text-primary-ink"
            >
              Hubungi Kami
            </Link>
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
