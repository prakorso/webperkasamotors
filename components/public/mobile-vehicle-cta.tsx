"use client";

import { useEffect, useState } from "react";
import { WhatsAppCta } from "./whatsapp-cta";

interface MobileVehicleCtaProps {
  href: string;
  price: string;
  vehicleTitle: string;
}

export function MobileVehicleCta({
  href,
  price,
  vehicleTitle,
}: MobileVehicleCtaProps) {
  const [placement, setPlacement] = useState<"hidden" | "fixed" | "docked">("hidden");

  useEffect(() => {
    const footer = document.querySelector("footer");
    const decisionArea = document.querySelector(
      'aside[aria-label="Hubungi Perkasa Motors mengenai kendaraan ini"]'
    );
    if (!footer || !decisionArea) return;

    let frame = 0;
    const updateVisibility = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const footerTop = footer.getBoundingClientRect().top;
        const decisionRect = decisionArea.getBoundingClientRect();
        const decisionAreaVisible =
          decisionRect.bottom > 0 && decisionRect.top <= window.innerHeight + 80;

        setPlacement(
          decisionAreaVisible
            ? "hidden"
            : footerTop <= window.innerHeight + 80
              ? "docked"
              : "fixed"
        );
      });
    };

    const footerObserver = new IntersectionObserver(updateVisibility, {
      rootMargin: "0px 0px 80px",
    });
    const decisionObserver = new IntersectionObserver(updateVisibility, {
      rootMargin: "0px 0px 80px",
    });

    updateVisibility();
    footerObserver.observe(footer);
    decisionObserver.observe(decisionArea);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    document.addEventListener("scroll", updateVisibility, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", updateVisibility);
    window.visualViewport?.addEventListener("resize", updateVisibility);

    return () => {
      cancelAnimationFrame(frame);
      footerObserver.disconnect();
      decisionObserver.disconnect();
      window.removeEventListener("scroll", updateVisibility);
      document.removeEventListener("scroll", updateVisibility, { capture: true });
      window.removeEventListener("resize", updateVisibility);
      window.visualViewport?.removeEventListener("resize", updateVisibility);
    };
  }, []);

  if (placement === "hidden") return null;

  return (
    <aside
      aria-label={`Kontak untuk ${vehicleTitle}`}
      className={`${placement === "docked" ? "absolute" : "fixed"} inset-x-0 bottom-0 z-40 border-t border-border/90 bg-paper/95 shadow-[0_-10px_30px_rgba(17,19,21,0.1)] backdrop-blur-sm md:hidden`}
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
        />
      </div>
    </aside>
  );
}
