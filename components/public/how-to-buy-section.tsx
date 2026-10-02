import type { ComponentType, SVGProps } from "react";
import { SectionHeading } from "@/components/public/section-heading";
import {
  CarOutlineIcon,
  ChatOutlineIcon,
  ChecklistOutlineIcon,
  KeyOutlineIcon,
} from "@/components/public/outline-icons";

/**
 * "Cara Pembelian" - code-owned (not editable in the CMS: it is business
 * process, not marketing content). Four steps shown as a timeline:
 * icon - line - icon on desktop, a vertical timeline on mobile. The icons
 * are monoline outlines (see outline-icons.tsx).
 * OWNER_FACT_REQUIRED: the owner should confirm these steps match how
 * units are actually sold (notably steps 3 and 4).
 */
const STEPS: Array<{
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  {
    title: "Pilih Unit",
    description: "Lihat mobil atau motor yang tersedia dan pilih unit yang sesuai.",
    Icon: CarOutlineIcon,
  },
  {
    title: "Hubungi Kami",
    description: "Tanyakan detail unit atau jadwalkan pengecekan melalui WhatsApp.",
    Icon: ChatOutlineIcon,
  },
  {
    title: "Cek & Sepakati",
    description: "Lihat unit, cek kondisinya, lalu sepakati transaksi.",
    Icon: ChecklistOutlineIcon,
  },
  {
    title: "Pembayaran & Serah Terima",
    description: "Selesaikan pembayaran dan lanjut ke proses serah terima kendaraan.",
    Icon: KeyOutlineIcon,
  },
];

export function HowToBuySection({ className }: { className?: string }) {
  return (
    <section id="cara-pembelian" aria-labelledby="how-to-buy-heading" className={className}>
      <SectionHeading eyebrow="Proses" title="Cara Pembelian" id="how-to-buy-heading" />
      <ol className="grid grid-cols-1 lg:grid-cols-4">
        {STEPS.map(({ title, description, Icon }, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <li
              key={title}
              className="relative flex gap-5 pb-8 last:pb-0 lg:flex-col lg:items-center lg:gap-0 lg:px-4 lg:pb-0 lg:text-center"
            >
              <div className="flex flex-col items-center lg:block">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-ink/25 bg-surface text-ink">
                  <Icon width={42} height={42} />
                </span>
                {!isLast && <span aria-hidden="true" className="mt-2 w-px flex-1 bg-border lg:hidden" />}
              </div>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-[calc(50%+2.75rem)] right-[calc(-50%+2.75rem)] top-8 hidden h-px bg-border lg:block"
                />
              )}
              <div className="pt-1 lg:pt-6">
                <p className="font-body text-label font-semibold uppercase tracking-[0.12em] text-primary">
                  Langkah {i + 1}
                </p>
                <h3 className="mt-1 font-display text-headline-sm leading-tight text-ink">{title}</h3>
                <p className="mt-2 font-body text-[14px] leading-relaxed text-muted lg:mx-auto lg:max-w-[16rem]">
                  {description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
