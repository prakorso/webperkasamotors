import { SectionHeading } from "@/components/public/section-heading";

/**
 * "Cara Pembelian" — a compact four-step strip that explains the buying
 * process, replacing the generic "Mengapa Perkasa Motors?" cards. One
 * flow only (no separate cash / financing tracks, no booking, no
 * scheduling). Copy is deliberately generic and promises nothing.
 * OWNER_FACT_REQUIRED: the owner must confirm these steps match how
 * units are actually sold (notably steps 3 and 4).
 */
const STEPS: Array<{ title: string; description: string }> = [
  { title: "Pilih unit", description: "Lihat unit yang tersedia di situs ini." },
  { title: "Hubungi lewat WhatsApp", description: "Tanyakan ketersediaan dan detail unit." },
  { title: "Lihat & cek unit", description: "Atur waktu untuk melihat dan mengecek unit." },
  { title: "Sepakati transaksi & serah terima", description: "Selesaikan transaksi dan terima unit." },
];

export function HowToBuySection({ className }: { className?: string }) {
  return (
    <section aria-labelledby="how-to-buy-heading" className={className}>
      <SectionHeading eyebrow="Proses" title="Cara Pembelian" id="how-to-buy-heading" />
      <ol className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-[20px] border border-border/80 bg-surface p-5 lg:flex-col lg:gap-3"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-[15px] font-semibold text-primary"
            >
              {i + 1}
            </span>
            <div>
              <h3 className="font-display text-headline-sm leading-tight text-ink">{step.title}</h3>
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-2xl font-body text-body text-muted">
        Pembayaran tunai atau kredit melalui perusahaan pembiayaan; detail dibahas lewat WhatsApp.
      </p>
    </section>
  );
}
