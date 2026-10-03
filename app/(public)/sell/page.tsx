import type { Metadata } from "next";
import { SectionHeading } from "@/components/public/section-heading";
import { SellVehicleForm } from "@/components/public/sell-vehicle-form";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Jual Mobil & Motor",
  description:
    "Tawarkan mobil atau motor Anda ke Perkasa Motors dengan mengisi informasi kendaraan dan lanjutkan diskusi melalui WhatsApp.",
  alternates: { canonical: absoluteUrl("/sell") },
};

/** Code-owned process copy (business process, not CMS content). No operational promise beyond "discuss, check, agree". */
const STEPS = [
  { title: "Isi Data Kendaraan", description: "Lengkapi informasi dasar kendaraan dan harga yang Anda harapkan." },
  { title: "Kirim Penawaran", description: "Data akan disusun otomatis menjadi pesan WhatsApp." },
  {
    title: "Diskusi via WhatsApp",
    description: "Tim Perkasa Motors akan review informasi awal dan berdiskusi terkait harga serta kondisi unit.",
  },
  {
    title: "Pengecekan Unit",
    description: "Jika penawaran dapat dilanjutkan, pengecekan kendaraan dan dokumen dilakukan sesuai kesepakatan.",
  },
  {
    title: "Kesepakatan",
    description: "Transaksi dilanjutkan setelah kondisi unit, dokumen, dan harga disepakati kedua pihak.",
  },
] as const;

/**
 * "Jual Kendaraan" — frontend-only offer flow. The form validates locally
 * and hands the visitor to WhatsApp with a generated message; nothing is
 * posted to any Perkasa system (no API route, database or storage).
 */
export default async function SellPage() {
  const settings = await getWebsiteSettings();

  return (
    <>
      <section aria-labelledby="sell-heading" className="px-6 pb-10 pt-12 md:px-8 lg:px-margin lg:pb-14 lg:pt-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 font-body text-label uppercase tracking-[0.06em] text-primary">Jual Kendaraan</p>
          <h1 id="sell-heading" className="font-display text-headline-lg text-ink lg:text-display-sm">
            Mau Jual Mobil atau Motor?
          </h1>
          <p className="mt-4 font-body text-body-lg text-muted">
            Berikan informasi kendaraan Anda untuk kami review terlebih dahulu. Jika ada ketertarikan, proses dapat
            dilanjutkan melalui WhatsApp untuk diskusi harga dan langkah berikutnya.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <SellVehicleForm whatsappNumber={settings.whatsapp} companyName={settings.companyName} />
          <p className="mt-5 font-body text-[13px] leading-relaxed text-muted">
            Informasi yang dikirim merupakan penawaran awal dan belum menjadi kesepakatan transaksi. Harga dan proses
            selanjutnya akan didiskusikan berdasarkan kondisi kendaraan dan kelengkapan dokumen.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="sell-how-heading"
        className="border-t border-border/80 bg-surface px-6 py-12 md:px-8 lg:px-margin lg:py-16"
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Proses" title="Cara Kerjanya" id="sell-how-heading" className="mb-8 lg:mb-10" />
          <ol className="space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/25 font-display text-[15px] font-semibold text-ink"
                >
                  {i + 1}
                </span>
                <div className="pt-1">
                  <h3 className="font-display text-[18px] font-semibold leading-tight text-ink">{step.title}</h3>
                  <p className="mt-1 font-body text-[14px] leading-relaxed text-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
