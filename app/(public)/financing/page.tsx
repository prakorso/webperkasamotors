import type { Metadata } from "next";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import { getWebsiteSettings } from "@/lib/data/site-settings";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Pembiayaan Kendaraan",
  description:
    "Informasi pembiayaan kendaraan di Perkasa Motors. Simulasi sesungguhnya ditanyakan lewat WhatsApp.",
};

/**
 * Financing is guidance only — no calculator, no default rate, no default
 * price, no monthly figure. Perkasa Motors is not the lender; actual terms
 * come from the finance company. The only action is a WhatsApp request
 * for a real simulation.
 * OWNER_FACT_REQUIRED: whether Perkasa assists with the application
 * itself, and with which finance companies, is not stated here.
 */
const FACTORS: Array<{ title: string; description: string }> = [
  { title: "Uang muka (DP)", description: "Besarnya ditentukan oleh perusahaan pembiayaan." },
  { title: "Tenor", description: "Lama cicilan ditentukan oleh perusahaan pembiayaan." },
  { title: "Bunga", description: "Suku bunga ditentukan oleh perusahaan pembiayaan." },
  {
    title: "Biaya lain",
    description: "Biaya administrasi, asuransi, dan biaya lainnya mengikuti ketentuan perusahaan pembiayaan.",
  },
  {
    title: "Persetujuan",
    description: "Persetujuan pembiayaan bergantung pada profil pemohon dan penilaian perusahaan pembiayaan.",
  },
];

const SIMULATION_MESSAGE =
  "Halo Perkasa Motors, saya ingin menanyakan simulasi pembiayaan untuk unit yang tersedia. Mohon informasinya.";

export default async function FinancingPage() {
  const settings = await getWebsiteSettings();
  const whatsappHref = buildWhatsAppUrl(settings.whatsapp, SIMULATION_MESSAGE);

  return (
    <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <div className="max-w-2xl">
        <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">Pembiayaan</p>
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">
          Pembiayaan Kendaraan
        </h1>
        <p className="mt-6 font-body text-body-lg text-muted">
          Pembayaran bisa tunai atau kredit melalui perusahaan pembiayaan (leasing). Pembiayaan diproses oleh
          perusahaan pembiayaan, bukan oleh Perkasa Motors, sehingga angka pasti baru diketahui lewat simulasi
          yang sesungguhnya.
        </p>
      </div>

      <section aria-labelledby="financing-factors-heading" className="mt-12 max-w-3xl">
        <h2 id="financing-factors-heading" className="font-display text-headline-sm text-ink">
          Yang menentukan cicilan
        </h2>
        <dl className="mt-4 border-t border-border/80">
          {FACTORS.map((factor) => (
            <div key={factor.title} className="grid gap-1 border-b border-border/70 py-4 sm:grid-cols-3 sm:gap-6">
              <dt className="font-body text-body font-semibold text-ink">{factor.title}</dt>
              <dd className="font-body text-body text-muted sm:col-span-2">{factor.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 max-w-3xl">
        <p className="font-body text-body text-muted">
          Untuk simulasi yang sesungguhnya, tanyakan lewat WhatsApp dengan menyebutkan unit yang Anda minati.
        </p>
        <div className="mt-6">
          {whatsappHref ? (
            <WhatsAppCta
              href={whatsappHref}
              label="Tanya Simulasi via WhatsApp"
              className="h-auto min-h-13 whitespace-normal py-3 text-center"
            />
          ) : (
            <p className="font-body text-body text-muted">Hubungi kami lewat halaman Kontak.</p>
          )}
        </div>
      </div>
    </div>
  );
}
