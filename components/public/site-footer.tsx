import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { getFooterSettings } from "@/lib/data/footer";
import { applyPublicNavRules, getPublicNavRules, withCoreLinks } from "@/lib/data/public-nav";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";
import { genericWhatsAppMessage } from "@/lib/utils/whatsapp";

function copyrightStatement(companyName: string, configuredText: string) {
  const configured = configuredText.trim();

  // The CMS may store either a suffix ("All rights reserved.") or a full
  // statement. Do not prepend a second generated copyright to a complete one.
  if (/^(?:©|copyright\b)/i.test(configured)) return configured;

  const owner = `© ${new Date().getFullYear()} ${companyName}`;
  return configured ? `${owner}. ${configured}` : owner;
}

export async function SiteFooter() {
  const [rawFooter, navRules] = await Promise.all([getFooterSettings(), getPublicNavRules()]);
  // Footer navigation (R1): Beli Mobil, Beli Motor, Artikel (only when >= 3
  // articles are published). Links to the retired About/Pembiayaan/Kontak
  // pages are dropped; the two catalogue links are guaranteed even if the
  // CMS rows are removed.
  const ruledGroups = rawFooter.navGroups
    .map((group) => ({ ...group, items: applyPublicNavRules(group.items, navRules) }))
    .filter((group) => group.items.length > 0);
  const navGroups = ruledGroups.length
    ? [
        { ...ruledGroups[0], items: withCoreLinks(ruledGroups[0].items, "FOOTER_NAV", ruledGroups[0].groupLabel) },
        ...ruledGroups.slice(1),
      ]
    : [{ groupLabel: null, items: withCoreLinks([], "FOOTER_NAV", null) }];
  const footer = {
    ...rawFooter,
    navGroups,
    legalLinks: applyPublicNavRules(rawFooter.legalLinks, navRules),
  };
  const hasContact = footer.phone || footer.whatsapp || footer.email || footer.address;
  const socialLinks = [
    ...(footer.instagramUrl
      ? [{ label: "Instagram", href: footer.instagramUrl, icon: <InstagramIcon size={16} /> }]
      : []),
    ...(footer.facebookUrl
      ? [{ label: "Facebook", href: footer.facebookUrl, icon: <FacebookIcon size={16} /> }]
      : []),
    ...(footer.tiktokUrl
      ? [{ label: "TikTok", href: footer.tiktokUrl, icon: <TiktokIcon size={16} /> }]
      : []),
    ...(footer.youtubeUrl
      ? [{ label: "YouTube", href: footer.youtubeUrl, icon: <YoutubeIcon size={16} /> }]
      : []),
    ...(footer.linkedinUrl
      ? [{ label: "LinkedIn", href: footer.linkedinUrl, icon: <LinkedinIcon size={16} /> }]
      : []),
  ];

  // Preserve the established destination and generic message behavior.
  const whatsappNumber = footer.whatsapp
    ? (normalizeIndonesianPhone(footer.whatsapp) ?? footer.whatsapp.replace(/\D/g, ""))
    : null;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        genericWhatsAppMessage(footer.companyName, footer.whatsappGenericTemplate)
      )}`
    : null;
  const showNavGroupLabels = footer.navGroups.length > 1;

  return (
    <footer className="border-t-2 border-primary bg-ink text-paper">
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-12 md:px-8 lg:px-margin lg:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-12 lg:gap-x-12 lg:pb-12">
          <div className="lg:col-span-5">
            <Link
              href="/"
              aria-label={`${footer.companyName} home`}
              className="inline-flex min-h-11 items-center rounded-sm transition-opacity hover:opacity-85"
            >
              <Logo
                companyName={footer.companyName}
                logoUrl={footer.logoUrl}
                textClassName="text-headline-lg text-paper md:text-[34px]"
                imageClassName="h-9 md:h-10"
              />
            </Link>

            {footer.description && (
              <p className="mt-4 max-w-md font-body text-body leading-relaxed text-paper/70">
                {footer.description}
              </p>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-7">
                <p className="font-body text-label font-semibold uppercase tracking-[0.14em] text-paper/60">
                  Ikuti Kami
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {socialLinks.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-paper/75 transition-colors hover:text-primary"
                      >
                        {social.icon}
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div
              className={
                hasContact && footer.navGroups.length > 0
                  ? "grid gap-8 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-10"
                  : "grid gap-8"
              }
            >
              {footer.navGroups.length > 0 && (
                <nav aria-label="Footer" className="order-2 sm:order-1">
                  <p className="font-body text-label font-semibold uppercase tracking-[0.14em] text-paper/60">
                    Jelajahi
                  </p>
                  <div className="mt-3 flex flex-col gap-5">
                    {footer.navGroups.map((group) => (
                      <div key={group.groupLabel ?? "ungrouped"}>
                        {showNavGroupLabels && group.groupLabel && (
                          <p className="mb-1 font-body text-[11px] uppercase tracking-[0.12em] text-paper/45">
                            {group.groupLabel}
                          </p>
                        )}
                        <ul className="flex flex-col">
                          {group.items.map((link) => (
                            <li key={link.id}>
                              <Link
                                href={link.href}
                                target={link.isExternal ? "_blank" : undefined}
                                rel={link.isExternal ? "noopener noreferrer" : undefined}
                                className="inline-flex min-h-11 items-center font-body text-body text-paper/80 transition-colors hover:text-primary"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </nav>
              )}

              {hasContact && (
                <div id="kontak" className="order-1 sm:order-2">
                  <p className="font-body text-label font-semibold uppercase tracking-[0.14em] text-paper/60">
                    Kontak
                  </p>
                  <div className="mt-4 font-body text-[14px] leading-relaxed text-paper/75">
                    {footer.address && <p className="max-w-xs">{footer.address}</p>}
                    {(footer.phone || footer.email) && (
                      <ul className={footer.address ? "mt-3" : undefined}>
                        {footer.phone && (
                          <li>
                            <a
                              href={`tel:${footer.phone}`}
                              className="inline-flex min-h-10 items-center transition-colors hover:text-primary"
                            >
                              {footer.phone}
                            </a>
                          </li>
                        )}
                        {footer.email && (
                          <li>
                            <a
                              href={`mailto:${footer.email}`}
                              className="inline-flex min-h-10 items-center transition-colors hover:text-primary"
                            >
                              {footer.email}
                            </a>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {footer.whatsapp && whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Chat lewat WhatsApp: ${footer.whatsapp}`}
                      title="Chat lewat WhatsApp"
                      className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-[12px] bg-primary px-5 font-body text-primary-ink shadow-[0_10px_28px_rgba(215,25,32,0.18)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-primary-hover hover:shadow-[0_14px_32px_rgba(169,15,21,0.24)] active:translate-y-px"
                    >
                      <WhatsappIcon size={17} aria-hidden="true" />
                      <span className="flex flex-col text-left">
                        <span className="text-label font-semibold uppercase tracking-[0.08em]">
                          WhatsApp
                        </span>
                        <span className="text-[13px] leading-4">{footer.whatsapp}</span>
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 font-body text-[12px] text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyrightStatement(footer.companyName, footer.copyrightText)}</p>
          {footer.legalLinks.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {footer.legalLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    target={link.isExternal ? "_blank" : undefined}
                    rel={link.isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex min-h-10 items-center transition-colors hover:text-primary"
                  >
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
