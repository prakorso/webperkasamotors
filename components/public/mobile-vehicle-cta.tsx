"use client";

import { useEffect, useRef } from "react";
import { WhatsAppCta } from "./whatsapp-cta";
import { vehicleTrackingFields } from "@/lib/measurement/events";
import type { Vehicle } from "@/lib/types";

interface MobileVehicleCtaProps {
  href: string;
  price: string;
  vehicleTitle: string;
  vehicle: Vehicle;
}

export function MobileVehicleCta({
  href,
  price,
  vehicleTitle,
  vehicle,
}: MobileVehicleCtaProps) {
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateVisibility = () => {
      const cta = ctaRef.current;
      const footer = document.querySelector("footer");
      const decisionArea = document.querySelector(
        'aside[aria-label="Hubungi Perkasa Motors mengenai kendaraan ini"]'
      );
      if (!cta) return;

      let placement: "hidden" | "fixed" | "docked" = "hidden";
      if (footer && decisionArea && window.innerWidth < 768) {
        const footerTop = footer.getBoundingClientRect().top;
        const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
        const decisionRect = decisionArea.getBoundingClientRect();
        const decisionAreaVisible =
          decisionRect.bottom > 0 && decisionRect.top <= window.innerHeight + 80;

        placement = decisionAreaVisible
          ? "hidden"
          : footerTop <= headerBottom + 80
            ? "hidden"
          : footerTop <= window.innerHeight + 80
            ? "docked"
            : "fixed";
      }

      cta.hidden = placement === "hidden";
      cta.classList.toggle("fixed", placement === "fixed");
      cta.classList.toggle("absolute", placement === "docked");
    };

    const domObserver = new MutationObserver(updateVisibility);

    updateVisibility();
    domObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", updateVisibility, { passive: true });
    document.addEventListener("scroll", updateVisibility, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", updateVisibility);
    window.visualViewport?.addEventListener("resize", updateVisibility);

    return () => {
      domObserver.disconnect();
      window.removeEventListener("scroll", updateVisibility);
      document.removeEventListener("scroll", updateVisibility, { capture: true });
      window.removeEventListener("resize", updateVisibility);
      window.visualViewport?.removeEventListener("resize", updateVisibility);
    };
  }, []);

  return (
    <aside
      ref={ctaRef}
      hidden
      aria-label={`Kontak untuk ${vehicleTitle}`}
      className="fixed inset-x-0 bottom-0 z-40 [&.fixed]:bottom-[var(--consent-offset,0px)] border-t border-border/90 bg-paper/95 shadow-[0_-10px_30px_rgba(17,19,21,0.1)] backdrop-blur-sm md:hidden"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="min-w-0 shrink-0">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            Harga
          </p>
          <p className="mt-0.5 whitespace-nowrap font-display text-[17px] font-semibold leading-tight tabular-nums text-ink">
            {price}
          </p>
        </div>
        <WhatsAppCta
          href={href}
          label="Tanya via WhatsApp"
          size="md"
          className="min-h-11 min-w-0 flex-1 px-4 text-center"
          ariaLabel={`Tanya ${vehicleTitle} lewat WhatsApp`}
          tracking={{ location: "detail_sticky", context: "vehicle", ...vehicleTrackingFields(vehicle) }}
        />
      </div>
    </aside>
  );
}
