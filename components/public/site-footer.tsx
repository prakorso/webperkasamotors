import Link from "next/link";
import { getFooterSettings } from "@/lib/data/footer";

/**
 * PHASE 2C: fully database-driven (Footer Manager, via lib/data/footer.ts)
 * — company name/description, contact, social, nav groups, legal, and
 * copyright text. Layout/classes are unchanged from Phase 1 for the parts
 * that exist today (company block + one "Navigasi" group); contact,
 * social, and legal are new *optional* blocks that only render when
 * configured, so an empty database renders byte-identical to before.
 */
export async function SiteFooter() {
  const footer = await getFooterSettings();
  const hasContact = footer.phone || footer.whatsapp || footer.email || footer.address;
  const hasSocial =
    footer.instagramUrl || footer.facebookUrl || footer.tiktokUrl || footer.youtubeUrl;

  return (
    <footer className="border-t border-border bg-ink text-paper">
      <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-display text-headline-lg">{footer.companyName}</p>
            {footer.description && (
              <p className="mt-4 max-w-sm font-body text-body text-muted-2">
                {footer.description}
              </p>
            )}

            {hasContact && (
              <ul className="mt-6 flex flex-col gap-1.5 font-body text-[13px] text-paper/80">
                {footer.address && <li>{footer.address}</li>}
                {footer.phone && (
                  <li>
                    <a href={`tel:${footer.phone}`} className="hover:text-primary">
                      {footer.phone}
                    </a>
                  </li>
                )}
                {footer.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${footer.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      WhatsApp: {footer.whatsapp}
                    </a>
                  </li>
                )}
                {footer.email && (
                  <li>
                    <a href={`mailto:${footer.email}`} className="hover:text-primary">
                      {footer.email}
                    </a>
                  </li>
                )}
              </ul>
            )}

            {hasSocial && (
              <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 font-body text-[13px] uppercase tracking-[0.06em] text-paper/80">
                {footer.instagramUrl && (
                  <li>
                    <a
                      href={footer.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {footer.facebookUrl && (
                  <li>
                    <a
                      href={footer.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Facebook
                    </a>
                  </li>
                )}
                {footer.tiktokUrl && (
                  <li>
                    <a
                      href={footer.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      TikTok
                    </a>
                  </li>
                )}
                {footer.youtubeUrl && (
                  <li>
                    <a
                      href={footer.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      YouTube
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          {footer.navGroups.length > 0 && (
            <div className="flex flex-col gap-8 lg:col-span-3 lg:col-start-8">
              {footer.navGroups.map((group) => (
                <div key={group.groupLabel ?? "ungrouped"}>
                  {group.groupLabel && (
                    <p className="font-body text-label uppercase tracking-[0.1em] text-muted-2">
                      {group.groupLabel}
                    </p>
                  )}
                  <ul className="mt-6 flex flex-col gap-3">
                    {group.items.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          target={link.isExternal ? "_blank" : undefined}
                          rel={link.isExternal ? "noopener noreferrer" : undefined}
                          className="font-body text-body text-paper/80 hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 font-body text-[13px] text-muted-2">
          <p>
            © {new Date().getFullYear()} {footer.companyName}. {footer.copyrightText}
          </p>
          {footer.legalLinks.length > 0 && (
            <ul className="flex gap-4">
              {footer.legalLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
