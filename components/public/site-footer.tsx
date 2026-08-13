import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "Tentang Kami" },
  { href: "/contact", label: "Hubungi Kami" },
  { href: "/financing", label: "Simulasi Kredit" },
  { href: "/articles", label: "Articles" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink text-paper">
      <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-display text-headline-lg">Perkasa Motors</p>
            <p className="mt-4 max-w-sm font-body text-body text-muted-2">
              Premium automotive digital showroom. Presisi, Performa, Perkasa.
            </p>
          </div>
          <div className="lg:col-span-3 lg:col-start-8">
            <p className="font-body text-label uppercase tracking-[0.1em] text-muted-2">
              Navigasi
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-body text-paper/80 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 font-body text-[13px] text-muted-2">
          © {new Date().getFullYear()} Perkasa Motors. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
