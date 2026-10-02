import type { HomepageAbout } from "@/lib/types";

/**
 * Short homepage "Tentang Perkasa Motors" block (there is no standalone
 * About page). Owner-editable through Website > Beranda; any field left
 * empty falls back to the code-owned copy below, which only states facts
 * the business configuration supports (what is sold, where, how contact
 * and payment work). No quality, inspection, curation, warranty or
 * guarantee claims. No "Selengkapnya" link by design.
 * OWNER_FACT_REQUIRED: the owner should review the default copy.
 */
const DEFAULT_POINTS: [string, string, string] = [
  "Mobil dan motor dalam satu tempat",
  "Komunikasi langsung lewat WhatsApp",
  "Pembelian tunai atau melalui pembiayaan",
];

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveHomepageAbout(about: HomepageAbout, companyName: string, address: string | null) {
  return {
    eyebrow: clean(about.eyebrow),
    title: clean(about.title) ?? `Tentang ${companyName}`,
    description:
      clean(about.description) ??
      `${companyName} menjual mobil dan motor${address ? ` di ${address}` : ""}. Unit yang ditampilkan di situs ini adalah stok ${companyName}.`,
    points: about.points.map((p, i) => clean(p) ?? DEFAULT_POINTS[i]),
  };
}

export function HomepageAboutSection({
  about,
  companyName,
  address,
  className,
}: {
  about: HomepageAbout;
  companyName: string;
  address: string | null;
  className?: string;
}) {
  if (!about.isActive) return null;
  const content = resolveHomepageAbout(about, companyName, address);

  return (
    <section id="tentang" aria-labelledby="home-about-heading" className={className}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <p className="mb-3 font-body text-label uppercase tracking-[0.06em] text-primary">
            {content.eyebrow ?? "Tentang Kami"}
          </p>
          <h2 id="home-about-heading" className="font-display text-headline-lg text-ink">
            {content.title}
          </h2>
          <p className="mt-5 max-w-xl whitespace-pre-line font-body text-body-lg leading-relaxed text-muted">
            {content.description}
          </p>
        </div>
        <ul className="divide-y divide-border border-y border-border lg:col-span-6 lg:self-center">
          {content.points.map((point) => (
            <li key={point} className="flex items-start gap-4 py-5">
              <span
                aria-hidden="true"
                className="mt-2 h-px w-6 shrink-0 bg-primary"
              />
              <span className="font-body text-body text-ink">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
