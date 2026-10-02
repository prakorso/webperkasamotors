import type { ComponentType, SVGProps } from "react";
import { SectionHeading } from "@/components/public/section-heading";
import { WhatsAppCta } from "@/components/public/whatsapp-cta";
import {
  BanknoteOutlineIcon,
  CalendarCoinOutlineIcon,
  DocumentOutlineIcon,
} from "@/components/public/outline-icons";

/**
 * "Mekanisme Pembayaran" - code-owned business-process information, not
 * weekly marketing content, so it has no CMS fields. Deliberately states
 * no tenor, percentage, DP, fee, interest or guarantee: only what the
 * business has confirmed. The three methods are peers (no "recommended"
 * plan, no pricing-tier styling) and share the monoline outline family
 * with "Cara Pembelian".
 * OWNER_FACT_REQUIRED: the owner should confirm Cash Tempo wording.
 */
const METHODS: Array<{
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  {
    title: "Cash Keras",
    description: "Pembayaran penuh sesuai nilai transaksi yang telah disepakati.",
    Icon: BanknoteOutlineIcon,
  },
  {
    title: "Cash Tempo",
    description:
      "Pembayaran dilakukan sesuai kesepakatan antara pembeli dan Perkasa Motors dalam periode pembayaran yang disepakati.",
    Icon: CalendarCoinOutlineIcon,
  },
  {
    title: "Cicilan / Kredit",
    description:
      "Pembelian melalui perusahaan pembiayaan. DP, tenor, bunga, biaya, dan persetujuan mengikuti ketentuan perusahaan pembiayaan. Perkasa Motors bukan penyedia pembiayaan.",
    Icon: DocumentOutlineIcon,
  },
];

export function PaymentMethodsSection({
  className,
  whatsappHref,
}: {
  className?: string;
  /** Pre-built generic payment-inquiry wa.me URL; the CTA is omitted when WhatsApp is not configured. */
  whatsappHref: string | null;
}) {
  return (
    <section id="pembayaran" aria-labelledby="payment-heading" className={className}>
      <SectionHeading eyebrow="Pembayaran" title="Mekanisme Pembayaran" id="payment-heading" />
      <ul className="grid grid-cols-1 divide-y divide-border border-y border-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {METHODS.map(({ title, description, Icon }) => (
          <li key={title} className="flex gap-5 py-7 lg:flex-col lg:gap-4 lg:px-8 lg:py-9 lg:first:pl-0 lg:last:pr-0">
            <span className="shrink-0 text-ink">
              <Icon width={44} height={44} />
            </span>
            <div>
              <h3 className="font-display text-headline-sm leading-tight text-ink">{title}</h3>
              <p className="mt-2 max-w-md font-body text-[14px] leading-relaxed text-muted">{description}</p>
            </div>
          </li>
        ))}
      </ul>
      {whatsappHref && (
        <div className="mt-8">
          <WhatsAppCta
            href={whatsappHref}
            label="Tanyakan Mekanisme Pembayaran"
            variant="secondary"
            className="h-auto min-h-13 whitespace-normal py-3 text-center"
          />
        </div>
      )}
    </section>
  );
}
