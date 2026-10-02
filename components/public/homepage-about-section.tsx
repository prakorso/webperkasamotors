import Image from "next/image";
import type { AboutMedia, HomepageAbout } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/**
 * Homepage "Tentang Perkasa Motors" block (there is no standalone About
 * page). It does two jobs: say who Perkasa Motors is (owner-editable copy,
 * with code-owned fallbacks that only state facts the business
 * configuration supports) and show visual proof that real transactions
 * happen (the owner-managed "proof" photos). No quality, inspection,
 * curation, warranty or guarantee claims. No "Selengkapnya" link by design.
 *
 * With no active photos (none uploaded yet, or the photo table is not
 * installed) the section renders exactly as before, copy only: no empty
 * frames, no placeholders. Photos are REAL Perkasa Motors images only.
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

/**
 * Restrained editorial collage, at most 4 photos (the data layer already
 * caps the list): 1 photo = one frame; 2 = two portrait frames side by side;
 * 3 = a wide main photo + 2 squares; 4 = a wide main photo + 3 squares. Not
 * an equal grid, not a carousel. Crops are centered slightly above middle so
 * faces in handover photos are not clipped. Captions (optional) sit under
 * the photo, never over it.
 */
function AboutCollage({ media: all, companyName }: { media: AboutMedia[]; companyName: string }) {
  // Defensive cap (the data layer already limits to 4).
  const media = all.slice(0, 4);
  const n = media.length;
  const spans = (i: number) => {
    if (n === 1) return { col: "col-span-6", aspect: "aspect-[16/10] lg:aspect-[4/3]", sizes: "(min-width: 1024px) 45vw, 100vw" };
    if (n === 2) return { col: "col-span-3", aspect: "aspect-[4/5]", sizes: "(min-width: 1024px) 22vw, 50vw" };
    if (i === 0) return { col: "col-span-6", aspect: "aspect-[16/10]", sizes: "(min-width: 1024px) 45vw, 100vw" };
    return {
      col: n === 3 ? "col-span-3" : "col-span-2",
      aspect: "aspect-square",
      sizes: n === 3 ? "(min-width: 1024px) 22vw, 50vw" : "(min-width: 1024px) 15vw, 33vw",
    };
  };

  return (
    <div className="grid grid-cols-6 gap-3 md:gap-4">
      {media.map((item, i) => {
        const s = spans(i);
        return (
          <figure key={item.id} className={s.col}>
            <div className={cn("relative overflow-hidden rounded-[16px] bg-surface-muted", s.aspect)}>
              <Image
                src={item.url}
                alt={item.caption ?? `Foto ${companyName}`}
                fill
                sizes={s.sizes}
                className="object-cover object-[center_35%]"
              />
            </div>
            {item.caption && (
              <figcaption className="mt-2 font-body text-[12px] leading-snug text-muted">{item.caption}</figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}

export function HomepageAboutSection({
  about,
  media = [],
  companyName,
  address,
  className,
}: {
  about: HomepageAbout;
  /** Active proof photos in display order (already capped). Empty renders the copy-only layout. */
  media?: AboutMedia[];
  companyName: string;
  address: string | null;
  className?: string;
}) {
  if (!about.isActive) return null;
  const content = resolveHomepageAbout(about, companyName, address);
  const hasMedia = media.length > 0;

  const copy = (
    <>
      <p className="mb-3 font-body text-label uppercase tracking-[0.06em] text-primary">
        {content.eyebrow ?? "Tentang Kami"}
      </p>
      <h2 id="home-about-heading" className="font-display text-headline-lg text-ink">
        {content.title}
      </h2>
      <p className="mt-5 max-w-xl whitespace-pre-line font-body text-body-lg leading-relaxed text-muted">
        {content.description}
      </p>
    </>
  );

  const points = (
    <ul className="divide-y divide-border border-y border-border">
      {content.points.map((point) => (
        <li key={point} className="flex items-start gap-4 py-5">
          <span aria-hidden="true" className="mt-2 h-px w-6 shrink-0 bg-primary" />
          <span className="font-body text-body text-ink">{point}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section id="tentang" aria-labelledby="home-about-heading" className={className}>
      {hasMedia ? (
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-6">
            {copy}
            <div className="mt-8">{points}</div>
          </div>
          <div className="lg:col-span-6">
            <AboutCollage media={media} companyName={companyName} />
          </div>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">{copy}</div>
          <div className="lg:col-span-6 lg:self-center">{points}</div>
        </div>
      )}
    </section>
  );
}
