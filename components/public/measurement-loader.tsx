"use client";

import { useEffect } from "react";
import Script from "next/script";
import { getConsentStatus, googleConsentState, subscribeToConsent } from "@/lib/measurement/consent";
import { isMeasurementHost, MEASUREMENT_HOSTNAME } from "@/lib/measurement/host";
import { trackWhatsAppClick, type WhatsAppClickDataset } from "@/lib/measurement/events";

/**
 * GTM Container ID (e.g. "GTM-XXXXXXX"). Set in Netlify production env
 * only — see docs/tracking/measurement-architecture.md. Left unset, this
 * component still establishes dataLayer/consent (harmless) but injects no
 * script, so the app builds and runs correctly before the container
 * exists.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * The single measurement orchestration mount point — rendered once from
 * app/(public)/layout.tsx, never from the root layout (which also wraps
 * /admin). GTM is the only tag-loading layer: GA4 and Meta Pixel are
 * configured as GTM tags (container-side), not loaded here directly.
 *
 * Responsibilities, strictly in this order (docs/tracking/
 * measurement-architecture.md §2 "R1B loader contract"):
 *  1. Initialize window.dataLayer and set the Google Consent Mode v2
 *     default (denied unless the visitor already accepted) BEFORE the
 *     GTM container can load.
 *  2. Replay the visitor's stored choice as a consent update, if any.
 *  3. Load the GTM container script, gated to the production host.
 *  4. Push a consent update on every later preference change.
 *  5. Run the one delegated click listener for every WhatsApp CTA
 *     (data-wa-location) on the page — see lib/measurement/events.ts.
 */
export function MeasurementLoader() {
  useEffect(() => {
    if (!isMeasurementHost(window.location.hostname)) return;

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    }
    gtag("consent", "default", { ...googleConsentState(null), wait_for_update: 500 });

    const initialStatus = getConsentStatus();
    if (initialStatus) gtag("consent", "update", googleConsentState(initialStatus));

    const unsubscribe = subscribeToConsent(() => {
      gtag("consent", "update", googleConsentState(getConsentStatus()));
    });

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[data-wa-location]");
      if (!anchor) return;
      trackWhatsAppClick(anchor.dataset as unknown as WhatsAppClickDataset, anchor.href, window.location.pathname);
    }
    document.addEventListener("click", onClick);

    return () => {
      unsubscribe();
      document.removeEventListener("click", onClick);
    };
  }, []);

  if (!GTM_ID) return null;

  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`
        if (window.location.hostname === ${JSON.stringify(MEASUREMENT_HOSTNAME)}) {
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});
        }
      `}
    </Script>
  );
}
