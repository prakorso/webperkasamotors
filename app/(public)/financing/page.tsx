import type { Metadata } from "next";
import { FinancingCalculator } from "@/components/public/financing-calculator";
import { getWebsiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = {
  title: "Simulasi Kredit",
  description: "Estimate your monthly installment for a Perkasa Motors vehicle.",
};

export default async function FinancingPage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="mx-auto max-w-container px-6 py-16 md:px-8 lg:px-margin lg:py-section">
      <div className="mb-12 max-w-2xl">
        <p className="mb-4 font-body text-label uppercase tracking-[0.1em] text-primary">
          Simulasi Kredit
        </p>
        <h1 className="font-display text-headline-lg text-ink lg:text-display-sm">
          Hitung estimasi cicilan Anda.
        </h1>
      </div>
      <FinancingCalculator
        whatsapp={{
          number: settings.whatsapp,
          companyName: settings.companyName,
          genericTemplate: settings.whatsappGenericTemplate,
        }}
      />
    </div>
  );
}
