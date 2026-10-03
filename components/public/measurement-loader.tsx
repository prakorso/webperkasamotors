"use client";

import { useEffect } from "react";
import Script from "next/script";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  getConsentStatus,
  googleConsentState,
  subscribeToConsent,
} from "@/lib/measurement/consent";
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
 * Order matters: GTM reads Consent Mode state when the container starts,
 * so the default (denied) and the replay of a stored "accepted" choice are
 * emitted by the SAME inline script that then injects gtm.js (a React
 * effect runs too late — Tag Assistant showed tags firing before it).
 * This component's effect only handles what happens after load: consent
 * updates on later preference changes and the one delegated
 * whatsapp_click listener (data-wa-location, lib/measurement/events.ts).
 */
export function MeasurementLoader() {
  useEffect(() => {
    if (!isMeasurementHost(window.location.hostname)) return;

    window.dataLayer = window.dataLayer || [];
    // GTM only recognises gtag commands pushed as the `arguments` object, never a plain array.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    }

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
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent','default',Object.assign(${JSON.stringify(googleConsentState(null))},{wait_for_update:500}));
          try {
            var r = JSON.parse(window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}));
            if (r && r.version === ${CONSENT_VERSION} && r.status === 'accepted') gtag('consent','update',${JSON.stringify(googleConsentState("accepted"))});
          } catch (e) {}
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});
        }
      `}
    </Script>
  );
}
