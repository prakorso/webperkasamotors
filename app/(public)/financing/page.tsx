import type { Metadata } from "next";
import { FinancingCalculator } from "@/components/public/financing-calculator";

export const metadata: Metadata = {
  title: "Simulasi Kredit",
  description: "Estimate your monthly installment for a Perkasa Motors vehicle.",
};

export default function FinancingPage() {
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
      <FinancingCalculator />
    </div>
  );
}
